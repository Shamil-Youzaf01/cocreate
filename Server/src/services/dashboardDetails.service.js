import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import Application from "../models/Application.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import Withdrawal from "../models/Withdrawal.js";
import Dispute from "../models/Dispute.js";
import getCampaignBudgetUsage from "../utils/getCampaignBudgetUsage.js";
import buildBudgetSummary from "../utils/buildBudgetSummary.js";

function months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1)));
}

async function monthly(Model, match, dates) {
  return Model.aggregate([
    { $match: { ...match, createdAt: { $gte: dates[0], $lt: new Date(Date.UTC(dates[5].getUTCFullYear(), dates[5].getUTCMonth() + 1, 1)) } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } },
  ]);
}

function series(dates, values) {
  return dates.map(date => ({
    month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
    ...Object.fromEntries(Object.entries(values).map(([name, rows]) => [name, rows.find(row => row._id === date.toISOString().slice(0, 7))?.count ?? 0])),
  }));
}

const submissionList = filter => Submission.find(filter).sort({ createdAt: -1 }).limit(5)
  .select("campaignId creatorId status submittedAt createdAt")
  .populate("campaignId", "title deadline").populate("creatorId", "name").lean();

async function deliverables(filter) {
  const rows = await Application.aggregate([
    { $match: { ...filter, status: "ACCEPTED" } },
    { $lookup: { from: Submission.collection.name, localField: "_id", foreignField: "applicationId", as: "submission" } },
    { $match: { "submission.status": { $nin: ["APPROVED", "REJECTED"] } } },
    { $sort: { createdAt: -1 } }, { $limit: 5 },
    { $project: { campaignId: 1, creatorId: 1, status: 1, "submission.status": 1 } },
  ]);
  const populated = await Application.populate(rows, [{ path: "campaignId", select: "title deadline" }, { path: "creatorId", select: "name" }]);
  return populated.map(item => ({ _id: item._id, campaignId: item.campaignId, creatorId: item.creatorId, status: item.submission[0]?.status || "ACCEPTED", deadline: item.campaignId?.deadline }));
}

export async function brandDetails(campaignIds) {
  const filter = { campaignId: { $in: campaignIds } };
  const dates = months();
  const [apps, submissions, rejected, priorityQueue, activeDeliverables, submissionReviewQueue] = await Promise.all([
    monthly(Application, filter, dates), monthly(Submission, filter, dates),
    Application.countDocuments({ ...filter, status: "REJECTED" }),
    Application.find({ ...filter, status: "PENDING" }).sort({ createdAt: 1 }).limit(5).select("creatorId campaignId status createdAt").populate("creatorId", "name").populate("campaignId", "title").lean(),
    deliverables(filter),
    submissionList({ ...filter, status: "SUBMITTED" }),
  ]);
  return { campaignActivity: series(dates, { applications: apps, submissions }), rejected, priorityQueue, activeDeliverables, submissionReviewQueue, committedEscrow: null };
}

export async function adminDetails() {
  const dates = months();
  const [creators, brands, pendingWithdrawals, newBrands, disputeEscalations] = await Promise.all([
    monthly(User, { role: "CREATOR" }, dates), monthly(User, { role: "BRAND" }, dates),
    Withdrawal.find({ status: "PENDING" }).sort({ createdAt: 1 }).limit(5).select("creatorId amount status createdAt").populate("creatorId", "name").lean(),
    User.find({ role: "BRAND" }).sort({ createdAt: -1 }).limit(5).select("name email createdAt").lean(),
    Dispute.find({ status: { $in: ["OPEN", "UNDER_REVIEW"] } }).sort({ createdAt: 1 }).limit(5).select("subject category status campaignId").populate("campaignId", "title").lean(),
  ]);
  return { userTrajectory: series(dates, { creators, brands }), pendingWithdrawals, newBrands, disputeEscalations, campaignReviewQueue: null };
}

export async function creatorDetails(userId) {
  const [activeDeliverables, recentApplications, appliedIds] = await Promise.all([
    deliverables({ creatorId: new mongoose.Types.ObjectId(userId) }),
    Application.find({ creatorId: userId }).sort({ createdAt: -1 }).limit(5).select("campaignId status createdAt").populate("campaignId", "title rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline").lean(),
    Application.distinct("campaignId", { creatorId: userId }),
  ]);
  const recommendations = await Campaign.find({ _id: { $nin: appliedIds }, status: "PUBLISHED", deadline: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(5).select("title coverImage description platform contentType status campaignBudget rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator creatorSlots deadline").lean();
  const recommendedCampaigns = await Promise.all(recommendations.map(async campaign => ({
    ...campaign,
    ...buildBudgetSummary({ campaignBudget: campaign.campaignBudget, rewardsIssued: await getCampaignBudgetUsage(campaign._id) }),
  })));
  return { activeDeliverables: activeDeliverables.map(item => ({ ...item, deadline: item.campaignId?.deadline })), recentApplications, recommendedCampaigns };
}
