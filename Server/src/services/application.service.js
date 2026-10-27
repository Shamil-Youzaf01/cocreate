import { notifyUser } from "./notification.service.js";
import mongoose from "mongoose";
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

  const application = await Application.create({
    campaignId,
    creatorId,
    message,
  });
  await notifyUser({ recipientId: campaign.brandId, eventKey: `application:${application._id}:created`, type: "APPLICATION", title: "New campaign application", message: `A creator applied to ${campaign.title}.`, href: "/dashboard/applications" });
  return application;
};

const getCreatorApplications = async (creatorId) => {
  return Application.find({ creatorId })
    .populate("campaignId", "title platform contentType rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status")
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
  const session = await mongoose.startSession();
  try {
    let application;
    let campaign;
    await session.withTransaction(async () => {
      application = await Application.findById(applicationId).session(session);

      if (!application) {
        throw new AppError("Application not found", 404);
      }

      campaign = await Campaign.findById(application.campaignId).session(session);

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
        // All acceptances write this shared document. Conflicting transactions retry
        // before recounting slots, including when approving different applications.
        await Campaign.updateOne({ _id: campaign._id }, { $inc: { __v: 1 } }, { session });
        const acceptedCount = await Application.countDocuments({
          campaignId: campaign._id,
          status: "ACCEPTED",
        }).session(session);

        if (campaign.creatorSlots != null && acceptedCount >= campaign.creatorSlots) {
          throw new AppError("Maximum number of creators has been reached", 400);
        }
      }

      application.status = decision;
      application.reviewedAt = new Date();

      await application.save({ session });
    });

    await notifyUser({ recipientId: application.creatorId, eventKey: `application:${application._id}:${decision}`, type: "APPLICATION", title: decision === "ACCEPTED" ? "Application accepted" : "Application not selected", message: `Your application for ${campaign.title} was ${decision.toLowerCase()}.`, href: "/dashboard/applications" });
  return application;
  } finally {
    await session.endSession();
  }
};

export {
  applyToCampaign,
  getCreatorApplications,
  getCampaignApplications,
  reviewApplication,
};
