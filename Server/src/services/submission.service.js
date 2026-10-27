import { notifyUser } from "./notification.service.js";
import Submission from "../models/Submission.js";
import Application from "../models/Application.js";
import Campaign from "../models/Campaign.js";
import AppError from "../utils/AppError.js";
import mongoose from "mongoose";
import withSubmissionCredits from "../utils/withSubmissionCredits.js";
import extractYouTubeVideoId from "../utils/extractYouTubeVideoId.js";
import { captureYouTubeBaseline } from "./youtubeTracking.service.js";

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

  let platformTracking = {
    platform: null,
    externalMediaId: null,
    baselineViews: 0,
    currentViews: 0,
    eligibleViews: 0,
    source: "MANUAL",
    syncStatus: "NOT_CONNECTED",
    lastSyncedAt: null,
    lastSyncError: null,
  };

  if (campaign.platform === "YOUTUBE") {
    platformTracking = await captureYouTubeBaseline(contentUrl);
  }

  const submission = await Submission.create({
    campaignId,
    creatorId,
    applicationId: application._id,
    contentUrl,
    caption,
    platformTracking,
  });
  await notifyUser({ recipientId: campaign.brandId, eventKey: `submission:${submission._id}:created`, type: "SUBMISSION", title: "New content to review", message: `A creator submitted content for ${campaign.title}.`, href: `/dashboard/submissions/campaign/${campaign._id}` });
  return submission;
};

const getCampaignSubmissions = async ({ campaignId, brandId }) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (campaign.brandId.toString() !== brandId) {
    throw new AppError("You are not authorized to view these submissions", 403);
  }

  const submissions = await Submission.find({ campaignId })
    .populate("creatorId", "name email")
    .sort({ createdAt: -1, _id: -1 });
  return withSubmissionCredits(submissions);
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

      if (decision === "APPROVED") {
        submission.rewardStatus = "PENDING_VERIFICATION";
      }

      await submission.save({ session });

      updatedSubmission = submission;
    });

    await notifyUser({ recipientId: updatedSubmission.creatorId, eventKey: `submission:${updatedSubmission._id}:${decision}:${updatedSubmission.reviewedAt.toISOString()}`, type: "SUBMISSION", title: decision === "APPROVED" ? "Content approved" : decision === "REVISION_REQUESTED" ? "Revision requested" : "Content rejected", message: feedback?.trim() || "Your submission review has been updated.", href: `/dashboard/submissions/${updatedSubmission._id}` });
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

  const campaign = await Campaign.findById(submission.campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (campaign.platform === "YOUTUBE") {
    const videoId = extractYouTubeVideoId(contentUrl);
    if (!videoId) throw new AppError("Please submit a valid YouTube video URL", 400);
    if (videoId !== submission.platformTracking?.externalMediaId || submission.platformTracking?.source !== "YOUTUBE_API") {
      submission.platformTracking = await captureYouTubeBaseline(contentUrl);
      submission.verifiedViews = 0;
      submission.calculatedReward = 0;
      submission.finalReward = 0;
      submission.viewsVerifiedAt = null;
      submission.rewardStatus = "PENDING_VERIFICATION";
    }
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

  await notifyUser({ recipientId: campaign.brandId, eventKey: `submission:${submission._id}:resubmitted:${submission.submittedAt.toISOString()}`, type: "SUBMISSION", title: "Revised content submitted", message: `Updated content for ${campaign.title} is ready for review.`, href: `/dashboard/submissions/campaign/${campaign._id}` });
  return submission;
};

export {
  createSubmission,
  getCampaignSubmissions,
  reviewSubmission,
  resubmitContent,
};
