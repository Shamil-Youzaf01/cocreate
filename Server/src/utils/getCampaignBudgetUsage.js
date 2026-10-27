import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

const getCampaignBudgetUsage = async (campaignId, session) => {
  // Mongoose does not cast aggregation filters, so normalize string IDs here.
  const id = new mongoose.Types.ObjectId(campaignId);
  const aggregation = Transaction.aggregate([
    {
      $match: {
        campaignId: id,
        type: "CAMPAIGN_REWARD",
        direction: "CREDIT",
        status: "COMPLETED",
      },
    },
    { $group: { _id: null, rewardsIssued: { $sum: "$amount" } } },
  ]);
  const result = await (session ? aggregation.session(session) : aggregation);

  return result[0]?.rewardsIssued || 0;
};

export default getCampaignBudgetUsage;
