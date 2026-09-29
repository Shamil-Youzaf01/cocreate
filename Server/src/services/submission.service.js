import Submission from "../models/Submission.js";
import Application from "../models/Application.js";
import Campaign from "../models/Campaign.js";
import AppError from "../utils/AppError.js";
import { creditCampaignReward } from "./wallet.service.js";
import mongoose from "mongoose";

const createSubmission = async ({
  campaignId,
  creatorId,
  contentUrl,
  caption,
}) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  const application = await Application.findOne({
    campaignId,
    creatorId,
  });

  if (!application) {
    throw new AppError("You have not applied to this campaign", 403);
  }

  if (application.status !== "ACCEPTED") {
    throw new AppError(
      "Your application must be accepted before submitting content",
      403,
    );
  }

  const existingSubmission = await Submission.findOne({
    campaignId,
    creatorId,
  });

  if (existingSubmission) {
    throw new AppError(
      "You have already submitted content for this campaign",
      409,
    );
  }

  return Submission.create({
    campaignId,
    creatorId,
    applicationId: application._id,
    contentUrl,
    caption,
  });
};

const getCampaignSubmissions = async ({ campaignId, brandId }) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.brandId.toString() !== brandId) {
    throw new AppError("You are not authorized to view these submissions", 403);
  }

  return Submission.find({ campaignId })
    .populate("creatorId", "name email")
    .sort({ createdAt: -1 });
};

const reviewSubmission = async ({
  submissionId,
  brandId,
  decision,
  feedback,
}) => {
  const session = await mongoose.startSession();

  try {
    let updatedSubmission;

    await session.withTransaction(async () => {
      const submission =
        await Submission.findById(submissionId).session(session);

      if (!submission) {
        throw new AppError("Submission not found", 404);
      }

      const campaign = await Campaign.findById(submission.campaignId).session(
        session,
      );

      if (!campaign) {
        throw new AppError("Campaign not found", 404);
      }

      if (campaign.brandId.toString() !== brandId) {
        throw new AppError(
          "You are not authorized to review this submission",
          403,
        );
      }

      if (submission.status !== "SUBMITTED") {
        throw new AppError("This submission is not available for review", 400);
      }

      const allowedDecisions = ["APPROVED", "REJECTED", "REVISION_REQUESTED"];

      if (!allowedDecisions.includes(decision)) {
        throw new AppError("Invalid submission decision", 400);
      }

      if (decision === "REVISION_REQUESTED" && !feedback?.trim()) {
        throw new AppError(
          "Feedback is required when requesting a revision",
          400,
        );
      }

      submission.status = decision;
      submission.feedback = feedback?.trim() || null;
      submission.reviewedAt = new Date();

      await submission.save({ session });

      // Money is created only when approved
      if (decision === "APPROVED") {
        await creditCampaignReward({
          creatorId: submission.creatorId,
          campaignId: campaign._id,
          submissionId: submission._id,
          amount: campaign.reward,
          session,
        });
      }

      updatedSubmission = submission;
    });

    return updatedSubmission;
  } finally {
    await session.endSession();
  }
};

const resubmitContent = async ({
  submissionId,
  creatorId,
  contentUrl,
  caption,
}) => {
  const submission = await Submission.findById(submissionId);

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  if (submission.creatorId.toString() !== creatorId) {
    throw new AppError("You are not authorized to update this submission", 403);
  }

  if (submission.status !== "REVISION_REQUESTED") {
    throw new AppError("This submission is not awaiting revision", 400);
  }

  submission.contentUrl = contentUrl;

  if (caption !== undefined) {
    submission.caption = caption;
  }

  submission.status = "SUBMITTED";

  // Old review is no longer current
  submission.feedback = null;
  submission.reviewedAt = null;
  submission.submittedAt = new Date();

  await submission.save();

  return submission;
};

export {
  createSubmission,
  getCampaignSubmissions,
  reviewSubmission,
  resubmitContent,
};
