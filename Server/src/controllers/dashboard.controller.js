import { getDashboard } from "../services/dashboard.service.js";
import Campaign from "../models/Campaign.js";
import Application from "../models/Application.js";
import Submission from "../models/Submission.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import Withdrawal from "../models/Withdrawal.js";

const getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let dashboard;

    if (role === "CREATOR") {
      dashboard = await getCreatorDashboard(userId);
    } else {
      dashboard = await getDashboard({ userId, role });
    }

    return res.status(200).json({
      success: true,

      data: {
        dashboard,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCreatorDashboard = async (userId) => {
  const now = new Date();

  const wallet = await Wallet.findOne({
    userId,
  }).lean();

  const [totalApplications, acceptedApplications, pendingApplications] =
    await Promise.all([
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
    ]);

  const acceptedApplicationRecords = await Application.find({
    creatorId: userId,
    status: "ACCEPTED",
  })
    .populate({
      path: "campaignId",
      select:
        "title description platform contentType reward deadline status brandId",
    })
    .sort({ updatedAt: -1 })
    .lean();

  const acceptedApplicationIds = acceptedApplicationRecords.map(
    (application) => application._id,
  );

  const submissions =
    acceptedApplicationIds.length > 0
      ? await Submission.find({
          creatorId: userId,
          applicationId: {
            $in: acceptedApplicationIds,
          },
        })
          .sort({ updatedAt: -1 })
          .lean()
      : [];

  const submissionByApplication = new Map();

  submissions.forEach((submission) => {
    submissionByApplication.set(
      submission.applicationId.toString(),
      submission,
    );
  });

  const activeDeliverables = acceptedApplicationRecords
    .filter((application) => {
      const campaign = application.campaignId;

      if (!campaign) {
        return false;
      }

      const submission = submissionByApplication.get(
        application._id.toString(),
      );

      if (submission && ["APPROVED", "REJECTED"].includes(submission.status)) {
        return false;
      }

      return (
        campaign.status === "PUBLISHED" && new Date(campaign.deadline) > now
      );
    })
    .map((application) => {
      const campaign = application.campaignId;

      const submission = submissionByApplication.get(
        application._id.toString(),
      );

      return {
        _id: submission?._id || application._id,

        applicationId: application._id,

        submissionId: submission?._id || null,

        campaignId: campaign._id,

        campaignTitle: campaign.title,

        platform: campaign.platform,

        contentType: campaign.contentType,

        reward: campaign.reward,

        deadline: campaign.deadline,

        status: submission?.status || "ACCEPTED",

        submittedAt: submission?.submittedAt || null,

        reviewedAt: submission?.reviewedAt || null,
      };
    })
    .slice(0, 3);

  const activeCampaigns = acceptedApplicationRecords.filter((application) => {
    const campaign = application.campaignId;

    if (!campaign) {
      return false;
    }

    const submission = submissionByApplication.get(application._id.toString());

    const finished =
      submission && ["APPROVED", "REJECTED"].includes(submission.status);

    return (
      !finished &&
      campaign.status === "PUBLISHED" &&
      new Date(campaign.deadline) > now
    );
  }).length;

  const underReview = await Submission.countDocuments({
    creatorId: userId,
    status: "SUBMITTED",
  });

  const [approvedSubmissions, revisionRequestedSubmissions] = await Promise.all(
    [
      Submission.countDocuments({
        creatorId: userId,
        status: "APPROVED",
      }),

      Submission.countDocuments({
        creatorId: userId,
        status: "REVISION_REQUESTED",
      }),
    ],
  );

  const appliedCampaigns = await Application.find({
    creatorId: userId,
  })
    .select("campaignId")
    .lean();

  const appliedCampaignIds = appliedCampaigns.map(
    (application) => application.campaignId,
  );

  const recommendedCampaigns = await Campaign.find({
    status: "PUBLISHED",

    deadline: {
      $gt: now,
    },

    _id: {
      $nin: appliedCampaignIds,
    },
  })
    .select(
      "title coverImage description platform contentType reward deadline maxCreators brandId createdAt",
    )
    .populate({
      path: "brandId",
      select: "name",
    })
    .sort({
      createdAt: -1,
    })
    .limit(3)
    .lean();

  const recentApplications = await Application.find({
    creatorId: userId,
  })
    .populate({
      path: "campaignId",
      select: "title reward platform contentType deadline",
    })
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .lean();

  const pendingWithdrawals = await Withdrawal.countDocuments({
    creatorId: userId,

    status: {
      $in: ["PENDING", "APPROVED"],
    },
  });

  const recentTransactions = await Transaction.find({
    userId,
  })
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .lean();

  return {
    wallet: {
      availableBalance: wallet?.availableBalance || 0,

      totalEarned: wallet?.totalEarned || 0,

      totalWithdrawn: wallet?.totalWithdrawn || 0,
    },

    applications: {
      total: totalApplications,
      accepted: acceptedApplications,
      pending: pendingApplications,

      active: activeCampaigns,
    },

    submissions: {
      approved: approvedSubmissions,

      revisionRequested: revisionRequestedSubmissions,

      underReview,
      awaitingAction: underReview + revisionRequestedSubmissions,
    },

    pendingWithdrawals,
    withdrawals: { pending: pendingWithdrawals },

    activeDeliverables,

    recommendedCampaigns,

    recentApplications,

    recentTransactions,
  };
};

export { getDashboardData };
