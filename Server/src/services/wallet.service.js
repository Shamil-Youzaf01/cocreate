import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import AppError from "../utils/AppError.js";

const creditCampaignReward = async ({
  creatorId,
  campaignId,
  submissionId,
  amount,
  session,
}) => {
  const existingTransaction = await Transaction.findOne({
    submissionId,
    type: "CAMPAIGN_REWARD",
  }).session(session);

  if (existingTransaction) {
    throw new AppError(
      "Reward has already been credited for this submission",
      409,
    );
  }

  let wallet = await Wallet.findOne({
    userId: creatorId,
  }).session(session);

  if (!wallet) {
    const wallets = await Wallet.create(
      [
        {
          userId: creatorId,
        },
      ],
      { session },
    );

    wallet = wallets[0];
  }

  await Transaction.create(
    [
      {
        userId: creatorId,
        type: "CAMPAIGN_REWARD",
        amount,
        direction: "CREDIT",
        status: "COMPLETED",
        campaignId,
        submissionId,
        description: "Campaign reward",
      },
    ],
    { session },
  );

  wallet.availableBalance += amount;
  wallet.totalEarned += amount;

  await wallet.save({ session });

  return wallet;
};
const getWallet = async (userId) => {
  let wallet = await Wallet.findOne({
    userId,
  });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
    });
  }

  return wallet;
};

const getTransactions = async (userId) => {
  return Transaction.find({
    userId,
  })
    .populate("campaignId", "title")
    .sort({ createdAt: -1 });
};

export { creditCampaignReward, getWallet, getTransactions };
