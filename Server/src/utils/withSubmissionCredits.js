import Transaction from "../models/Transaction.js";

export default async function withSubmissionCredits(submissions) {
  if (!submissions.length) return [];
  const totals = await Transaction.aggregate([
    { $match: { submissionId: { $in: submissions.map(item => item._id) }, type: "CAMPAIGN_REWARD", direction: "CREDIT", status: "COMPLETED" } },
    { $group: { _id: "$submissionId", creditedReward: { $sum: "$amount" } } },
  ]);
  const byId = new Map(totals.map(row => [String(row._id), row.creditedReward]));
  return submissions.map(item => ({ ...(item.toObject ? item.toObject() : item), creditedReward: byId.get(String(item._id)) || 0 }));
}
