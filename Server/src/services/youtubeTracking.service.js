import mongoose from "mongoose";
import Submission from "../models/Submission.js";
import Campaign from "../models/Campaign.js";
import Transaction from "../models/Transaction.js";
import AppError from "../utils/AppError.js";
import extractYouTubeVideoId from "../utils/extractYouTubeVideoId.js";
import calculateCampaignReward from "../utils/calculateCampaignReward.js";
import { getYouTubeVideoStats } from "./youtube.service.js";
import { rewardConfiguration } from "./performanceReward.service.js";

export async function captureYouTubeBaseline(contentUrl) {
  const videoId = extractYouTubeVideoId(contentUrl);
  if (!videoId) throw new AppError("Please submit a valid YouTube video URL", 400);
  const stats = await getYouTubeVideoStats(videoId);
  return { platform: "YOUTUBE", externalMediaId: stats.videoId, baselineViews: stats.viewCount,
    currentViews: stats.viewCount, eligibleViews: 0, source: "YOUTUBE_API", syncStatus: "ACTIVE",
    lastSyncedAt: new Date(), lastSyncError: null };
}

export async function syncYouTubeSubmission({ submissionId, user }) {
  if (!mongoose.isObjectIdOrHexString(submissionId)) throw new AppError("Invalid submission ID.", 400);
  const initial = await Submission.findById(submissionId);
  if (!initial) throw new AppError("Submission not found.", 404);
  const campaign = await Campaign.findById(initial.campaignId);
  if (!campaign) throw new AppError("Campaign not found.", 404);
  if (user && !((user.role === "BRAND" && String(campaign.brandId) === user.userId) ||
    (user.role === "CREATOR" && String(initial.creatorId) === user.userId))) throw new AppError("Unauthorized submission access.", 403);
  if (initial.status !== "APPROVED") throw new AppError("Only approved submissions can be synced.", 409);
  if (initial.rewardStatus === "CREDITED") throw new AppError("Reward already credited; tracking is closed.", 409);
  const tracking = initial.platformTracking;
  if (campaign.platform !== "YOUTUBE" || tracking?.source !== "YOUTUBE_API" || !tracking.externalMediaId ||
    extractYouTubeVideoId(initial.contentUrl) !== tracking.externalMediaId) throw new AppError("YouTube baseline is missing or does not match the submitted video.", 409);
  const sampledAt = new Date();
  let stats;
  try { stats = await getYouTubeVideoStats(tracking.externalMediaId); }
  catch (error) {
    await Submission.updateOne({ _id: submissionId, rewardStatus: { $ne: "CREDITED" }, contentUrl: initial.contentUrl,
      "platformTracking.lastSyncedAt": tracking.lastSyncedAt }, { $set: {
      "platformTracking.syncStatus": "FAILED", "platformTracking.lastSyncError": error.message } });
    throw error;
  }
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const submission = await Submission.findById(submissionId).session(session);
      if (!submission || submission.status !== "APPROVED" || submission.rewardStatus === "CREDITED" ||
        await Transaction.exists({ submissionId, type: "CAMPAIGN_REWARD", direction: "CREDIT" }).session(session)) throw new AppError("Submission is no longer available for syncing.", 409);
      if (submission.contentUrl !== initial.contentUrl || submission.platformTracking.externalMediaId !== tracking.externalMediaId ||
        submission.platformTracking.baselineViews !== tracking.baselineViews) throw new AppError("Submission changed. Retry syncing.", 409);
      if (submission.platformTracking.lastSyncedAt > sampledAt) { result = submission; return; }
      const currentCampaign = await Campaign.findById(submission.campaignId).session(session);
      if (!currentCampaign) throw new AppError("Campaign not found.", 404);
      rewardConfiguration(currentCampaign);
      const eligibleViews = Math.max(stats.viewCount - tracking.baselineViews, 0);
      const reward = calculateCampaignReward({ ...currentCampaign.toObject(), verifiedViews: eligibleViews });
      submission.platformTracking.currentViews = stats.viewCount;
      submission.platformTracking.eligibleViews = eligibleViews;
      submission.platformTracking.syncStatus = "ACTIVE";
      submission.platformTracking.lastSyncedAt = sampledAt;
      submission.platformTracking.lastSyncError = null;
      submission.verifiedViews = eligibleViews;
      submission.viewsVerifiedAt = sampledAt;
      submission.calculatedReward = reward.calculatedReward;
      submission.finalReward = reward.finalReward;
      submission.rewardStatus = reward.eligible ? "READY" : "NOT_ELIGIBLE";
      await submission.save({ session });
      result = submission;
    });
    return result;
  } finally { await session.endSession(); }
}
