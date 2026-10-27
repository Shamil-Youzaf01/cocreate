import mongoose from "mongoose";
import Submission from "../models/Submission.js";
import Transaction from "../models/Transaction.js";

export default async function getCampaignRewardOverview(campaignId) {
  const id = new mongoose.Types.ObjectId(campaignId);
  const [rows, rewardsCredited] = await Promise.all([
    Submission.aggregate([
      { $match: { campaignId: id, status: "APPROVED" } },
      { $group: { _id: null, creators: { $addToSet: "$creatorId" }, rewardsReady: { $sum: { $cond: [{ $eq: ["$rewardStatus", "READY"] }, 1, 0] } }, totalVerifiedViews: { $sum: "$verifiedViews" } } },
    ]),
    Transaction.countDocuments({ campaignId: id, type: "CAMPAIGN_REWARD", direction: "CREDIT", status: "COMPLETED" }),
  ]);
  return { approvedCreators: rows[0]?.creators.length || 0, rewardsReady: rows[0]?.rewardsReady || 0, rewardsCredited, totalVerifiedViews: rows[0]?.totalVerifiedViews || 0 };
}
