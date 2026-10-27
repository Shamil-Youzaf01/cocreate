import AppError from "../utils/AppError.js";
import {
  createCampaign as createCampaignService,
  getBrandCampaigns,
  getPublishedCampaigns,
  getCampaignById,
  updateCampaign,
  publishCampaign,
  closeCampaign,
} from "../services/campaign.service.js";
import Application from "../models/Application.js";
import Submission from "../models/Submission.js";
import getCampaignRewardOverview from "../utils/getCampaignRewardOverview.js";

const createCampaign = async (req, res) => {
  const {
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
  } = req.body;

  if (
    !title ||
    !description ||
    !requirements ||
    !platform ||
    !contentType ||
    campaignBudget === undefined ||
    rewardRatePerThousandViews === undefined ||
    minimumPayout === undefined ||
    maximumPayoutPerCreator === undefined ||
    !deadline
  ) {
    throw new AppError("All campaign fields are required", 400);
  }

  const deadlineDate = new Date(deadline);

  if (Number.isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
    throw new AppError("Campaign deadline must be a valid future date", 400);
  }

  const campaign = await createCampaignService({
    brandId: req.user.userId,
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
    creatorSlots: creatorSlots || null,
    deadline: deadlineDate,
  });

  res.status(201).json({
    success: true,
    message: "Campaign created successfully",
    data: {
      campaign,
    },
  });
};

const getMyCampaigns = async (req, res) => {
  const campaigns = await getBrandCampaigns(req.user.userId);

  res.status(200).json({
    success: true,
    results: campaigns.length,
    data: {
      campaigns,
    },
  });
};

const getPublished = async (req, res) => {
  const result = await getPublishedCampaigns({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    platform: req.query.platform,
    contentType: req.query.contentType,
    sort: req.query.sort,
  });

  res.status(200).json({
    success: true,
    results: result.campaigns.length,
    pagination: result.pagination,
    data: {
      campaigns: result.campaigns,
    },
  });
};

const getCampaign = async (req, res) => {
  const campaign = await getCampaignById(req.params.campaignId, req.user);
  let myApplication = null;
  let mySubmission = null;
  if (req.user.role === "CREATOR") {
    const filter = { campaignId: campaign._id, creatorId: req.user.userId };
    [myApplication, mySubmission] = await Promise.all([
      Application.findOne(filter).select("status").lean(),
      Submission.findOne(filter).select("status").lean(),
    ]);
  }
  if (req.user.role === "BRAND" && campaign.brandId?._id?.toString() === req.user.userId) {
    campaign.rewardOverview = await getCampaignRewardOverview(campaign._id);
  }

  res.status(200).json({
    success: true,
    data: {
      campaign,
      myApplication,
      mySubmission,
    },
  });
};

const editCampaign = async (req, res) => {
  if (req.body.deadline) {
    const deadline = new Date(req.body.deadline);

    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) {
      throw new AppError("Campaign deadline must be a valid future date", 400);
    }

    req.body.deadline = deadline;
  }

  const campaign = await updateCampaign({
    campaignId: req.params.campaignId,
    brandId: req.user.userId,
    updates: req.body,
  });

  res.status(200).json({
    success: true,
    message: "Campaign updated successfully",
    data: {
      campaign,
    },
  });
};

const publish = async (req, res) => {
  const campaign = await publishCampaign({
    campaignId: req.params.campaignId,
    brandId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    message: "Campaign published successfully",
    data: {
      campaign,
    },
  });
};

const close = async (req, res) => {
  const campaign = await closeCampaign({
    campaignId: req.params.campaignId,
    brandId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    message: "Campaign closed successfully",
    data: {
      campaign,
    },
  });
};

const uploadCampaignCover = async (req, res) => {
  if (!req.file) throw new AppError("Campaign image is required.", 400);
  res.status(200).json({
    success: true,
    message: "Campaign image uploaded successfully.",
    data: { coverImage: { url: req.file.path, publicId: req.file.filename } },
  });
};

export {
  uploadCampaignCover,
  createCampaign,
  getMyCampaigns,
  getPublished,
  getCampaign,
  editCampaign,
  publish,
  close,
};
