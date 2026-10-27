import { notifyUser } from "./notification.service.js";
import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import Submission from "../models/Submission.js";
import Transaction from "../models/Transaction.js";
import AppError from "../utils/AppError.js";
import calculateCampaignReward from "../utils/calculateCampaignReward.js";
import getCampaignBudgetUsage from "../utils/getCampaignBudgetUsage.js";
import buildBudgetSummary from "../utils/buildBudgetSummary.js";
import { creditCampaignReward } from "./wallet.service.js";

function validateId(id) {
  if (!mongoose.isObjectIdOrHexString(id)) throw new AppError("Invalid submission ID.", 400);
}

async function ownedCampaign(submission, brandId, session) {
  const campaign = await Campaign.findById(submission.campaignId).session(session);
  if (!campaign) throw new AppError("Campaign not found.", 404);
  if (campaign.brandId.toString() !== brandId) throw new AppError("Unauthorized campaign access.", 403);
  return campaign;
}

export function rewardConfiguration(campaign) {
  const fields = ["campaignBudget", "rewardRatePerThousandViews", "minimumPayout", "maximumPayoutPerCreator"];
  if (fields.some(field => !Number.isFinite(campaign[field])) || campaign.campaignBudget <= 0 || campaign.rewardRatePerThousandViews <= 0 || campaign.minimumPayout < 0 || campaign.maximumPayoutPerCreator <= 0 || campaign.minimumPayout > campaign.maximumPayoutPerCreator || campaign.maximumPayoutPerCreator > campaign.campaignBudget) {
    throw new AppError("Campaign reward configuration is invalid.", 409);
  }
}

export async function verifySubmissionViews({ submissionId, brandId, verifiedViews }) {
  validateId(submissionId);
  if (typeof verifiedViews !== "number" || !Number.isSafeInteger(verifiedViews) || verifiedViews < 0) throw new AppError("Verified views must be a whole number 0 or greater.", 400);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const submission = await Submission.findById(submissionId).session(session);
      if (!submission) throw new AppError("Submission not found.", 404);
      const campaign = await ownedCampaign(submission, brandId, session);
      if (campaign.platform === "YOUTUBE") throw new AppError("Use YouTube sync to verify views for this campaign.", 409);
      if (submission.status !== "APPROVED") throw new AppError("Only approved submissions can have views verified.", 409);
      if (submission.rewardStatus === "CREDITED" || await Transaction.exists({ submissionId, type: "CAMPAIGN_REWARD", direction: "CREDIT" }).session(session)) throw new AppError("Reward has already been credited.", 409);
      rewardConfiguration(campaign);
      const reward = calculateCampaignReward({ ...campaign.toObject(), verifiedViews });
      submission.verifiedViews = verifiedViews;
      submission.calculatedReward = reward.calculatedReward;
      submission.finalReward = reward.finalReward;
      submission.rewardStatus = reward.eligible ? "READY" : "NOT_ELIGIBLE";
      submission.viewsVerifiedAt = new Date();
      await submission.save({ session });
      result = submission;
    });
    return result;
  } finally { await session.endSession(); }
}

export async function creditSubmissionReward({ submissionId, brandId }) {
  validateId(submissionId);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const submission = await Submission.findById(submissionId).session(session);
      if (!submission) throw new AppError("Submission not found.", 404);
      const campaign = await ownedCampaign(submission, brandId, session);
      if (submission.status !== "APPROVED") throw new AppError("Submission must be approved before reward can be credited.", 409);
      if (submission.rewardStatus === "CREDITED") throw new AppError("Reward has already been credited for this submission.", 409);
      if (submission.rewardStatus !== "READY") throw new AppError("Reward is not ready for credit.", 409);
      rewardConfiguration(campaign);
      if (!Number.isFinite(submission.finalReward) || submission.finalReward <= 0 || submission.finalReward > campaign.maximumPayoutPerCreator) throw new AppError("Invalid final reward.", 409);

      // Serialize credits across all creators in this campaign. A concurrent
      // transaction retries with a fresh snapshot before checking budget again.
      await Campaign.updateOne({ _id: campaign._id }, { $inc: { __v: 1 } }, { session });
      if (await Transaction.exists({ submissionId, type: "CAMPAIGN_REWARD", direction: "CREDIT" }).session(session)) throw new AppError("Reward has already been credited for this submission.", 409);
      const rewardsIssued = await getCampaignBudgetUsage(campaign._id, session);
      if (submission.finalReward > campaign.campaignBudget - rewardsIssued) throw new AppError("Insufficient campaign budget to credit this reward.", 409);
      const wallet = await creditCampaignReward({ creatorId: submission.creatorId, campaignId: campaign._id, submissionId: submission._id, amount: submission.finalReward, session });
      submission.rewardStatus = "CREDITED";
      submission.rewardCreditedAt = new Date();
      await submission.save({ session });
      result = { submission: submission.toObject(), reward: submission.finalReward, wallet, ...buildBudgetSummary({ campaignBudget: campaign.campaignBudget, rewardsIssued: rewardsIssued + submission.finalReward }) };
    });
    await notifyUser({ recipientId: result.submission.creatorId, eventKey: `reward:${submissionId}:credited`, type: "REWARD", title: "Campaign reward credited", message: `Your campaign reward of INR ${result.reward} has been added to your wallet.`, href: "/dashboard/wallet" });
    return result;
  } finally { await session.endSession(); }
}
