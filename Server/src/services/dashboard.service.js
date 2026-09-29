import Campaign from "../models/Campaign.js";
import Application from "../models/Application.js";
import Submission from "../models/Submission.js";
import Wallet from "../models/Wallet.js";
import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import Report from "../models/Report.js";
import Dispute from "../models/Dispute.js";
import Transaction from "../models/Transaction.js";
import AppError from "../utils/AppError.js";

const getCreatorDashboard = async (userId) => {
  const [
    totalApplications,
    acceptedApplications,
    pendingApplications,
    approvedSubmissions,
    pendingSubmissions,
    wallet,
    pendingWithdrawals,
    recentTransactions,
  ] = await Promise.all([
    Application.countDocuments({
      creatorId: userId,
    }),

    Application.countDocuments({
      creatorId: userId,
      status: "ACCEPTED",
    }),

    Application.countDocuments({
      creatorId: userId,
      status: "PENDING",
    }),

    Submission.countDocuments({
      creatorId: userId,
      status: "APPROVED",
    }),

    Submission.countDocuments({
      creatorId: userId,
      status: {
        $in: ["SUBMITTED", "REVISION_REQUESTED"],
      },
    }),

    Wallet.findOne({
      userId,
    }).select("availableBalance totalEarned totalWithdrawn"),

    Withdrawal.countDocuments({
      creatorId: userId,
      status: {
        $in: ["PENDING", "APPROVED"],
      },
    }),

    Transaction.find({
      userId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .select("type amount direction status createdAt"),
  ]);

  return {
    applications: {
      total: totalApplications,
      accepted: acceptedApplications,
      pending: pendingApplications,
    },

    submissions: {
      approved: approvedSubmissions,
      awaitingAction: pendingSubmissions,
    },

    wallet: {
      availableBalance: wallet?.availableBalance ?? 0,
      totalEarned: wallet?.totalEarned ?? 0,
      totalWithdrawn: wallet?.totalWithdrawn ?? 0,
    },

    withdrawals: {
      pending: pendingWithdrawals,
    },

    recentTransactions,
  };
};

const getBrandDashboard = async (userId) => {
  const brandCampaigns = await Campaign.find({
    brandId: userId,
  }).select("_id");

  const campaignIds = brandCampaigns.map((campaign) => campaign._id);

  const [
    totalCampaigns,
    draftCampaigns,
    publishedCampaigns,
    closedCampaigns,
    totalApplications,
    pendingApplications,
    acceptedApplications,
    pendingSubmissions,
    approvedSubmissions,
  ] = await Promise.all([
    Campaign.countDocuments({
      brandId: userId,
    }),

    Campaign.countDocuments({
      brandId: userId,
      status: "DRAFT",
    }),

    Campaign.countDocuments({
      brandId: userId,
      status: "PUBLISHED",
    }),

    Campaign.countDocuments({
      brandId: userId,
      status: "CLOSED",
    }),

    Application.countDocuments({
      campaignId: {
        $in: campaignIds,
      },
    }),

    Application.countDocuments({
      campaignId: {
        $in: campaignIds,
      },
      status: "PENDING",
    }),

    Application.countDocuments({
      campaignId: {
        $in: campaignIds,
      },
      status: "ACCEPTED",
    }),

    Submission.countDocuments({
      campaignId: {
        $in: campaignIds,
      },
      status: {
        $in: ["SUBMITTED", "REVISION_REQUESTED"],
      },
    }),

    Submission.countDocuments({
      campaignId: {
        $in: campaignIds,
      },
      status: "APPROVED",
    }),
  ]);

  const recentCampaigns = await Campaign.find({
    brandId: userId,
  })
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .select("title status reward deadline createdAt");

  return {
    campaigns: {
      total: totalCampaigns,
      draft: draftCampaigns,
      published: publishedCampaigns,
      closed: closedCampaigns,
    },

    applications: {
      total: totalApplications,
      pending: pendingApplications,
      accepted: acceptedApplications,
    },

    submissions: {
      awaitingAction: pendingSubmissions,
      approved: approvedSubmissions,
    },
    recentCampaigns,
  };
};

const getAdminDashboard = async () => {
  const [
    totalUsers,
    totalCreators,
    totalBrands,
    activeUsers,
    suspendedUsers,
    bannedUsers,

    totalCampaigns,
    publishedCampaigns,

    openReports,
    openDisputes,

    pendingWithdrawals,
    approvedWithdrawals,

    totalRewardsPaid,
    totalWithdrawalsPaid,
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      role: "CREATOR",
    }),

    User.countDocuments({
      role: "BRAND",
    }),

    User.countDocuments({
      status: "ACTIVE",
    }),

    User.countDocuments({
      status: "SUSPENDED",
    }),

    User.countDocuments({
      status: "BANNED",
    }),

    Campaign.countDocuments(),

    Campaign.countDocuments({
      status: "PUBLISHED",
    }),

    Report.countDocuments({
      status: {
        $in: ["OPEN", "UNDER_REVIEW"],
      },
    }),

    Dispute.countDocuments({
      status: {
        $in: ["OPEN", "UNDER_REVIEW"],
      },
    }),

    Withdrawal.countDocuments({
      status: "PENDING",
    }),

    Withdrawal.countDocuments({
      status: "APPROVED",
    }),

    Transaction.aggregate([
      {
        $match: {
          type: "CAMPAIGN_REWARD",
          direction: "CREDIT",
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]),

    Transaction.aggregate([
      {
        $match: {
          type: "WITHDRAWAL",
          direction: "DEBIT",
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]),
  ]);

  return {
    users: {
      total: totalUsers,
      creators: totalCreators,
      brands: totalBrands,
      active: activeUsers,
      suspended: suspendedUsers,
      banned: bannedUsers,
    },

    campaigns: {
      total: totalCampaigns,
      published: publishedCampaigns,
    },

    moderation: {
      openReports,
      openDisputes,
    },

    withdrawals: {
      pending: pendingWithdrawals,
      approved: approvedWithdrawals,
    },

    financials: {
      totalRewards: totalRewardsPaid[0]?.total || 0,

      totalWithdrawals: totalWithdrawalsPaid[0]?.total || 0,
    },
  };
};

const getDashboard = async ({ userId, role }) => {
  switch (role) {
    case "CREATOR":
      return getCreatorDashboard(userId);

    case "BRAND":
      return getBrandDashboard(userId);

    case "ADMIN":
      return getAdminDashboard();

    default:
      throw new AppError("Unsupported user role", 403);
  }
};

export {
  getCreatorDashboard,
  getBrandDashboard,
  getAdminDashboard,
  getDashboard,
};
