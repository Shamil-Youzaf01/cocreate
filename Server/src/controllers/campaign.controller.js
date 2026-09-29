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

const createCampaign = async (req, res) => {
  const {
    title,
    description,
    requirements,
    platform,
    contentType,
    reward,
    maxCreators,
    deadline,
  } = req.body;

  if (
    !title ||
    !description ||
    !requirements ||
    !platform ||
    !contentType ||
    reward === undefined ||
    !maxCreators ||
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
    description,
    requirements,
    platform,
    contentType,
    reward,
    maxCreators,
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
  const campaign = await getCampaignById(req.params.campaignId);

  res.status(200).json({
    success: true,
    data: {
      campaign,
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

export {
  createCampaign,
  getMyCampaigns,
  getPublished,
  getCampaign,
  editCampaign,
  publish,
  close,
};
