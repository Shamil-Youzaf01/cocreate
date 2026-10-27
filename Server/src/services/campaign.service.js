import { notifyAdmins, notifyCampaignClosed } from "./notification.service.js";
import Campaign from "../models/Campaign.js";
import Application from "../models/Application.js";
import Submission from "../models/Submission.js";
import AppError from "../utils/AppError.js";
import getCampaignBudgetUsage from "../utils/getCampaignBudgetUsage.js";
import buildBudgetSummary from "../utils/buildBudgetSummary.js";
import {
  getPagination,
  getSort,
  buildSearchFilter,
  buildPaginationResponse,
} from "../utils/query.js";

function validateCampaignFormat(platform, contentType) {
  const valid = platform === "INSTAGRAM"
    ? contentType === "REEL"
    : platform === "YOUTUBE" && ["VIDEO", "SHORT"].includes(contentType);
  if (!valid) {
    throw new AppError("Instagram campaigns require Reels. YouTube campaigns require Video or Shorts.", 400);
  }
}

const createCampaign = async ({
  brandId,
  title,
  coverImage,
  description,
  requirements,
  platform,
  contentType,
  campaignBudget,
  rewardRatePerThousandViews,
  minimumPayout,
  maximumPayoutPerCreator,
  creatorSlots,
  deadline,
}) => {
  validateCampaignFormat(platform, contentType);
  return Campaign.create({
    brandId,
    title,
    coverImage: coverImage || { url: "", publicId: "" },
    description,
    requirements,
    platform,
    contentType,
    campaignBudget,
    rewardRatePerThousandViews,
    minimumPayout,
    maximumPayoutPerCreator,
    creatorSlots: creatorSlots || null,
    deadline,
    status: "DRAFT",
  });
};

// BRAND: get their own campaigns
const withBudget = async (campaign) => ({
  ...campaign.toObject(),
  ...buildBudgetSummary({ campaignBudget: campaign.campaignBudget, rewardsIssued: await getCampaignBudgetUsage(campaign._id) }),
});

const getBrandCampaigns = async (brandId) => {
  const campaigns = await Campaign.find({ brandId }).sort({ createdAt: -1 });
  return Promise.all(campaigns.map(withBudget));
};

// Public/Creator: only published campaigns
const getPublishedCampaigns = async ({
  page,
  limit,
  search,
  platform,
  contentType,
  sort,
}) => {
  const pagination = getPagination({
    page,
    limit,
  });

  const filter = {
    status: "PUBLISHED",
    deadline: {
      $gt: new Date(),
    },
  };

  if (platform) {
    const allowedPlatforms = ["INSTAGRAM", "YOUTUBE", "TIKTOK", "OTHER"];

    if (!allowedPlatforms.includes(platform)) {
      throw new AppError("Invalid platform", 400);
    }

    filter.platform = platform;
  }

  if (contentType) {
    const allowedContentTypes = [
      "VIDEO",
      "REEL",
      "POST",
      "STORY",
      "SHORT",
      "OTHER",
    ];

    if (!allowedContentTypes.includes(contentType)) {
      throw new AppError("Invalid content type", 400);
    }

    filter.contentType = contentType;
  }

  Object.assign(filter, buildSearchFilter(search, ["title", "description"]));

  const sortOption = getSort(
    { sort },
    ["createdAt", "deadline", "reward"],
    "-createdAt",
  );

  const [campaigns, total] = await Promise.all([
    Campaign.find(filter)
      .populate("brandId", "name")
      .sort(sortOption)
      .skip(pagination.skip)
      .limit(pagination.limit),

    Campaign.countDocuments(filter),
  ]);

  return {
    campaigns: await Promise.all(campaigns.map(withBudget)),
    pagination: buildPaginationResponse({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  };
};

// Get one campaign
const getCampaignById = async (campaignId, user) => {
  if (!user?.userId || !["BRAND", "CREATOR", "ADMIN"].includes(user.role)) {
    throw new AppError("Authentication required", 401);
  }
  const campaign = await Campaign.findById(campaignId).populate(
    "brandId",
    "name",
  );

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  const isOwner = user.role === "BRAND" &&
    String(campaign.brandId?._id ?? campaign.brandId) === user.userId;
  let visible = user.role === "ADMIN" || isOwner || campaign.status === "PUBLISHED";
  if (!visible && user.role === "CREATOR" && ["CLOSED", "COMPLETED"].includes(campaign.status)) {
    const participant = { campaignId: campaign._id, creatorId: user.userId };
    const [acceptedApplication, submission] = await Promise.all([
      Application.exists({ ...participant, status: "ACCEPTED" }),
      Submission.exists(participant),
    ]);
    visible = Boolean(acceptedApplication || submission);
  }
  if (!visible) {
    throw new AppError("Campaign not found", 404);
  }

  return withBudget(campaign);
};

// BRAND: edit own DRAFT
const updateCampaign = async ({ campaignId, brandId, updates }) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.brandId.toString() !== brandId) {
    throw new AppError("You are not authorized to edit this campaign", 403);
  }

  if (campaign.status !== "DRAFT") {
    throw new AppError("Only draft campaigns can be edited", 400);
  }

  const allowedFields = [
    "title",
    "coverImage",
    "description",
    "requirements",
    "platform",
    "contentType",
    "campaignBudget",
    "rewardRatePerThousandViews",
    "minimumPayout",
    "maximumPayoutPerCreator",
    "creatorSlots",
    "deadline",
  ];

  if (updates.platform !== undefined || updates.contentType !== undefined) {
    validateCampaignFormat(updates.platform ?? campaign.platform, updates.contentType ?? campaign.contentType);
  }

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      campaign[field] = updates[field];
    }
  });

  await campaign.save();

  return campaign;
};

// BRAND: publish own campaign
const publishCampaign = async ({ campaignId, brandId }) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.brandId.toString() !== brandId) {
    throw new AppError("You are not authorized to publish this campaign", 403);
  }

  if (campaign.status !== "DRAFT") {
    throw new AppError("Only draft campaigns can be published", 400);
  }

  if (campaign.deadline <= new Date()) {
    throw new AppError(
      "Cannot publish a campaign with an expired deadline",
      400,
    );
  }

  campaign.status = "PUBLISHED";

  await campaign.save();

  await notifyAdmins({ eventKey: `campaign:${campaign._id}:published`, type: "CAMPAIGN", title: "Campaign published", message: `${campaign.title} is now available to creators.`, href: `/dashboard/campaigns/${campaign._id}` });
  return campaign;
};

// BRAND: close own campaign
const closeCampaign = async ({ campaignId, brandId }) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.brandId.toString() !== brandId) {
    throw new AppError("You are not authorized to close this campaign", 403);
  }

  if (campaign.status !== "PUBLISHED") {
    throw new AppError("Only published campaigns can be closed", 400);
  }

  campaign.status = "CLOSED";

  await campaign.save();

  await notifyCampaignClosed(campaign);
  return campaign;
};

export {
  createCampaign,
  getBrandCampaigns,
  getPublishedCampaigns,
  getCampaignById,
  updateCampaign,
  publishCampaign,
  closeCampaign,
};
