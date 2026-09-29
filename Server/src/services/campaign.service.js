import Campaign from "../models/Campaign.js";
import AppError from "../utils/AppError.js";
import {
  getPagination,
  getSort,
  buildSearchFilter,
  buildPaginationResponse,
} from "../utils/query.js";

const createCampaign = async ({
  brandId,
  title,
  description,
  requirements,
  platform,
  contentType,
  reward,
  maxCreators,
  deadline,
}) => {
  return Campaign.create({
    brandId,
    title,
    description,
    requirements,
    platform,
    contentType,
    reward,
    maxCreators,
    deadline,
  });
};

// BRAND: get their own campaigns
const getBrandCampaigns = async (brandId) => {
  return Campaign.find({ brandId }).sort({ createdAt: -1 });
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
      .sort(sortOption)
      .skip(pagination.skip)
      .limit(pagination.limit),

    Campaign.countDocuments(filter),
  ]);

  return {
    campaigns,
    pagination: buildPaginationResponse({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  };
};

// Get one campaign
const getCampaignById = async (campaignId) => {
  const campaign = await Campaign.findById(campaignId).populate(
    "brandId",
    "name",
  );

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  return campaign;
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
    "description",
    "requirements",
    "platform",
    "contentType",
    "reward",
    "maxCreators",
    "deadline",
  ];

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
