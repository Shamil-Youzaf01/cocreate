import Application from "../models/Application.js";
import Campaign from "../models/Campaign.js";
import AppError from "../utils/AppError.js";

const applyToCampaign = async ({ campaignId, creatorId, message }) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.status !== "PUBLISHED") {
    throw new AppError("Applications are not open for this campaign", 400);
  }

  if (campaign.deadline <= new Date()) {
    throw new AppError("Campaign application deadline has passed", 400);
  }

  const existingApplication = await Application.findOne({
    campaignId,
    creatorId,
  });

  if (existingApplication) {
    throw new AppError("You have already applied to this campaign", 409);
  }

  return Application.create({
    campaignId,
    creatorId,
    message,
  });
};

const getCreatorApplications = async (creatorId) => {
  return Application.find({ creatorId })
    .populate("campaignId", "title platform contentType reward deadline status")
    .sort({ createdAt: -1 });
};

const getCampaignApplications = async ({ campaignId, brandId }) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.brandId.toString() !== brandId) {
    throw new AppError(
      "You are not authorized to view these applications",
      403,
    );
  }

  return Application.find({ campaignId })
    .populate("creatorId", "name email")
    .sort({ createdAt: -1 });
};

const reviewApplication = async ({ applicationId, brandId, decision }) => {
  const application = await Application.findById(applicationId);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  const campaign = await Campaign.findById(application.campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.brandId.toString() !== brandId) {
    throw new AppError(
      "You are not authorized to review this application",
      403,
    );
  }

  if (application.status !== "PENDING") {
    throw new AppError("This application has already been reviewed", 400);
  }

  if (!["ACCEPTED", "REJECTED"].includes(decision)) {
    throw new AppError("Decision must be ACCEPTED or REJECTED", 400);
  }

  if (decision === "ACCEPTED") {
    const acceptedCount = await Application.countDocuments({
      campaignId: campaign._id,
      status: "ACCEPTED",
    });

    if (acceptedCount >= campaign.maxCreators) {
      throw new AppError("Maximum number of creators has been reached", 400);
    }
  }

  application.status = decision;
  application.reviewedAt = new Date();

  await application.save();

  return application;
};

export {
  applyToCampaign,
  getCreatorApplications,
  getCampaignApplications,
  reviewApplication,
};
