import { creatorDetails } from "./dashboardDetails.service.js";
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

  const details = await creatorDetails(userId);
  return {
    ...details,
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

const getBrandDashboard = async (brandId) => {
  const now = new Date();

  /*
  |--------------------------------------------------------------------------
  | Brand Campaigns
  |--------------------------------------------------------------------------
  */

  const campaigns = await Campaign.find({
    brandId,
  })
    .select(
      "title rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status createdAt"
    )
    .sort({
      createdAt: -1,
    })
    .lean();

  const campaignIds = campaigns.map(
    (campaign) => campaign._id
  );

  /*
  |--------------------------------------------------------------------------
  | Applications
  |--------------------------------------------------------------------------
  */

  const applications = await Application.find({
    campaignId: {
      $in: campaignIds,
    },
  })
    .populate({
      path: "creatorId",
      select: "name email",
    })
    .populate({
      path: "campaignId",
      select:
        "title rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status",
    })
    .sort({
      createdAt: -1,
    })
    .lean();

  /*
  |--------------------------------------------------------------------------
  | Submissions
  |--------------------------------------------------------------------------
  */

  const submissions = await Submission.find({
    campaignId: {
      $in: campaignIds,
    },
  })
    .populate({
      path: "creatorId",
      select: "name email",
    })
    .populate({
      path: "campaignId",
      select:
        "title rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status",
    })
    .sort({
      updatedAt: -1,
    })
    .lean();

  /*
  |--------------------------------------------------------------------------
  | Campaign Counts
  |--------------------------------------------------------------------------
  */

  const activeCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.status ===
          "PUBLISHED" &&
        new Date(
          campaign.deadline
        ) > now
    );

  const draftCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.status ===
        "DRAFT"
    );

  const closedCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.status ===
        "CLOSED"
    );

  /*
  |--------------------------------------------------------------------------
  | Application Counts
  |--------------------------------------------------------------------------
  */

  const pendingApplications =
    applications.filter(
      (application) =>
        application.status ===
        "PENDING"
    );

  const acceptedApplications =
    applications.filter(
      (application) =>
        application.status ===
        "ACCEPTED"
    );

  const rejectedApplications =
    applications.filter(
      (application) =>
        application.status ===
        "REJECTED"
    );

  /*
  |--------------------------------------------------------------------------
  | Creators In Flight
  |--------------------------------------------------------------------------
  |
  | Accepted creators whose work has not reached APPROVED or REJECTED.
  |--------------------------------------------------------------------------
  */

const finalApplicationIds = new Set(
  submissions
    .filter((submission) =>
      ["APPROVED", "REJECTED"].includes(
        submission.status
      )
    )
    .map((submission) =>
      submission.applicationId?._id
        ? submission.applicationId._id.toString()
        : submission.applicationId?.toString()
    )
    .filter(Boolean)
);

const creatorsInFlight =
  acceptedApplications.filter(
    (application) =>
      !finalApplicationIds.has(
        application._id.toString()
      )
  );


  // Verified rewards awaiting credit; accepted applications do not reserve money.
  const committedRewards = submissions
    .filter(submission => submission.status === "APPROVED" && submission.rewardStatus === "READY")
    .reduce((total, submission) => total + Number(submission.finalReward || 0), 0);
  /*
  |--------------------------------------------------------------------------
  | Submission Counts
  |--------------------------------------------------------------------------
  */

  const awaitingReview =
    submissions.filter(
      (submission) =>
        submission.status ===
        "SUBMITTED"
    );

  const revisionRequested =
    submissions.filter(
      (submission) =>
        submission.status ===
        "REVISION_REQUESTED"
    );

  const approvedSubmissions =
    submissions.filter(
      (submission) =>
        submission.status ===
        "APPROVED"
    );

  /*
  |--------------------------------------------------------------------------
  | Active Campaign Funnel
  |--------------------------------------------------------------------------
  */

  const activeCampaignFunnel =
    activeCampaigns
      .slice(0, 5)
      .map((campaign) => {
        const campaignApplications =
          applications.filter(
            (application) =>
              application.campaignId
                ?._id?.toString() ===
              campaign._id.toString()
          );

        const campaignSubmissions =
          submissions.filter(
            (submission) =>
              submission.campaignId
                ?._id?.toString() ===
              campaign._id.toString()
          );

        return {
          _id: campaign._id,

          title:
            campaign.title,

          rewardRatePerThousandViews: campaign.rewardRatePerThousandViews,

          deadline:
            campaign.deadline,

          creatorSlots: campaign.creatorSlots,

          applicants:
            campaignApplications.length,

          accepted:
            campaignApplications.filter(
              (item) =>
                item.status ===
                "ACCEPTED"
            ).length,

          submitted:
            campaignSubmissions.filter(
              (item) =>
                item.status ===
                "SUBMITTED"
            ).length,

          revisionRequested:
            campaignSubmissions.filter(
              (item) =>
                item.status ===
                "REVISION_REQUESTED"
            ).length,

          approved:
            campaignSubmissions.filter(
              (item) =>
                item.status ===
                "APPROVED"
            ).length,
        };
      });

  /*
  |--------------------------------------------------------------------------
  | Campaign Activity - Last 6 Months
  |--------------------------------------------------------------------------
  */

  const activity = [];

  for (
    let offset = 5;
    offset >= 0;
    offset--
  ) {
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1
    );

    const end = new Date(
      now.getFullYear(),
      now.getMonth() - offset + 1,
      1
    );

    const monthCampaignIds =
      campaigns
        .filter((campaign) => {
          const created =
            new Date(
              campaign.createdAt
            );

          return (
            created >= start &&
            created < end
          );
        })
        .map((campaign) =>
          campaign._id.toString()
        );

    const applicationCount =
      applications.filter(
        (application) => {
          const created =
            new Date(
              application.createdAt
            );

          return (
            created >= start &&
            created < end
          );
        }
      ).length;

    const submissionCount =
      submissions.filter(
        (submission) => {
          const created =
            new Date(
              submission.createdAt
            );

          return (
            created >= start &&
            created < end
          );
        }
      ).length;

    activity.push({
      month:
        start.toLocaleString(
          "en-US",
          {
            month: "short",
          }
        ),

      campaigns:
        monthCampaignIds.length,

      applications:
        applicationCount,

      submissions:
        submissionCount,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Priority Queues
  |--------------------------------------------------------------------------
  */

  const applicationQueue =
    pendingApplications
      .slice(0, 5)
      .map((application) => ({
        _id:
          application._id,

        creator:
          application.creatorId,

        campaign:
          application.campaignId,

        message:
          application.message,

        createdAt:
          application.createdAt,

        status:
          application.status,
      }));

  const submissionQueue =
    awaitingReview
      .slice(0, 5)
      .map((submission) => ({
        _id:
          submission._id,

        creator:
          submission.creatorId,

        campaign:
          submission.campaignId,

        contentUrl:
          submission.contentUrl,

        caption:
          submission.caption,

        status:
          submission.status,

        submittedAt:
          submission.submittedAt,
      }));

  /*
  |--------------------------------------------------------------------------
  | Response
  |--------------------------------------------------------------------------
  */

  return {
    campaigns: {
      total:
        campaigns.length,

      active:
        activeCampaigns.length,

      draft:
        draftCampaigns.length,

      closed:
        closedCampaigns.length,
    },

    applications: {
      total:
        applications.length,

      pending:
        pendingApplications.length,

      accepted:
        acceptedApplications.length,

      rejected:
        rejectedApplications.length,
    },

    submissions: {
      awaitingReview:
        awaitingReview.length,

      revisionRequested:
        revisionRequested.length,

      approved:
        approvedSubmissions.length,
    },

    creatorsInFlight:
      creatorsInFlight.length,

    committedRewards,

    activity,

    activeCampaignFunnel,

    applicationQueue,

    submissionQueue,
  };
};

const getAdminDashboard = async () => {
  const now = new Date();

  /*
  |--------------------------------------------------------------------------
  | Main Counts
  |--------------------------------------------------------------------------
  */

  const [
    totalCreators,
    totalBrands,
    activeCampaigns,
    pendingWithdrawals,
  ] = await Promise.all([
    User.countDocuments({
      role: "CREATOR",
    }),

    User.countDocuments({
      role: "BRAND",
    }),

    Campaign.countDocuments({
      status: "PUBLISHED",
      deadline: {
        $gt: now,
      },
    }),

    Withdrawal.countDocuments({
      status: {
        $in: [
          "PENDING",
          "APPROVED",
        ],
      },
    }),
  ]);

  /*
  |--------------------------------------------------------------------------
  | Campaign Reports Requiring Review
  |--------------------------------------------------------------------------
  */

  const campaignReviewCount = await Report.countDocuments({ targetType: "CAMPAIGN", status: { $in: ["OPEN", "UNDER_REVIEW"] } });

  const campaignReports =
    await Report.find({
      targetType: "CAMPAIGN",

      status: {
        $in: [
          "OPEN",
          "UNDER_REVIEW",
        ],
      },
    })
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean();

  /*
  |--------------------------------------------------------------------------
  | Campaign Information For Reports
  |--------------------------------------------------------------------------
  */

  const campaignTargetIds =
    campaignReports
      .map((report) =>
        report.targetId
          ? report.targetId.toString()
          : null
      )
      .filter(Boolean);

  const reportedCampaigns =
    campaignTargetIds.length
      ? await Campaign.find({
          _id: {
            $in: campaignTargetIds,
          },
        })
          .populate(
            "brandId",
            "name email"
          )
          .select(
            "title status brandId deadline"
          )
          .lean()
      : [];

  const campaignMap =
    new Map(
      reportedCampaigns.map(
        (campaign) => [
          campaign._id.toString(),
          campaign,
        ]
      )
    );

  const campaignReviewQueue =
    campaignReports.map(
      (report) => ({
        _id: report._id,

        reportId:
          report._id,

        reason:
          report.reason,

        description:
          report.description,

        status:
          report.status,

        targetId:
          report.targetId,

        createdAt:
          report.createdAt,

        campaign:
          campaignMap.get(
            report.targetId?.toString()
          ) || null,
      })
    );

  /*
  |--------------------------------------------------------------------------
  | Withdrawal Queue
  |--------------------------------------------------------------------------
  */

  const withdrawalQueue =
    await Withdrawal.find({
      status: {
        $in: [
          "PENDING",
          "APPROVED",
        ],
      },
    })
      .populate(
        "creatorId",
        "name email"
      )
      .sort({
        createdAt: 1,
      })
      .limit(5)
      .lean();

  /*
  |--------------------------------------------------------------------------
  | New Brands
  |--------------------------------------------------------------------------
  */

  const newBrands =
    await User.find({
      role: "BRAND",
    })
      .select(
        "name email status createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean();

  /*
  |--------------------------------------------------------------------------
  | Dispute Escalations
  |--------------------------------------------------------------------------
  */

  const disputeQueue =
    await Dispute.find({
      status: {
        $in: [
          "OPEN",
          "UNDER_REVIEW",
        ],
      },
    })
      .populate(
        "campaignId",
        "title"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .lean();

  /*
  |--------------------------------------------------------------------------
  | Rewards Settled
  |--------------------------------------------------------------------------
  |
  | This is total creator rewards successfully credited.
  |--------------------------------------------------------------------------
  */

  const rewardAggregation =
    await Transaction.aggregate([
      {
        $match: {
          type:
            "CAMPAIGN_REWARD",

          direction:
            "CREDIT",

          status:
            "COMPLETED",
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
    ]);

  const rewardsSettled =
    rewardAggregation[0]
      ?.total || 0;

  /*
  |--------------------------------------------------------------------------
  | Paid Withdrawals
  |--------------------------------------------------------------------------
  */

  const withdrawalAggregation =
    await Transaction.aggregate([
      {
        $match: {
          type:
            "WITHDRAWAL",

          direction:
            "DEBIT",

          status:
            "COMPLETED",
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
    ]);

  const withdrawalsSettled =
    withdrawalAggregation[0]
      ?.total || 0;

  /*
  |--------------------------------------------------------------------------
  | User Trajectory - Last 6 Months
  |--------------------------------------------------------------------------
  */

  const userTrajectory = [];

  for (
    let offset = 5;
    offset >= 0;
    offset--
  ) {
    const start =
      new Date(
        now.getFullYear(),
        now.getMonth() -
          offset,
        1
      );

    const end =
      new Date(
        now.getFullYear(),
        now.getMonth() -
          offset +
          1,
        1
      );

    const [
      creators,
      brands,
    ] = await Promise.all([
      User.countDocuments({
        role: "CREATOR",

        createdAt: {
          $gte: start,
          $lt: end,
        },
      }),

      User.countDocuments({
        role: "BRAND",

        createdAt: {
          $gte: start,
          $lt: end,
        },
      }),
    ]);

    userTrajectory.push({
      month:
        start.toLocaleString(
          "en-US",
          {
            month: "short",
          }
        ),

      creators,

      brands,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Moderation Counts
  |--------------------------------------------------------------------------
  */

  const [
    openReports,
    openDisputes,
  ] = await Promise.all([
    Report.countDocuments({
      status: {
        $in: [
          "OPEN",
          "UNDER_REVIEW",
        ],
      },
    }),

    Dispute.countDocuments({
      status: {
        $in: [
          "OPEN",
          "UNDER_REVIEW",
        ],
      },
    }),
  ]);

  /*
  |--------------------------------------------------------------------------
  | Final Response
  |--------------------------------------------------------------------------
  */

  return {
    users: {
      creators:
        totalCreators,

      brands:
        totalBrands,
    },

    campaigns: {
      active:
        activeCampaigns,

      requiringReview:
        campaignReviewCount,
    },

    moderation: {
      openReports,
      openDisputes,
    },

    payouts: {
      pending:
        pendingWithdrawals,

      rewardsSettled,

      withdrawalsSettled,
    },

    userTrajectory,

    campaignReviewQueue,

    withdrawalQueue,

    newBrands,

    disputeQueue,
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
