import Application from "../models/Application.js";
import Campaign from "../models/Campaign.js";
import {
  applyToCampaign,
  getCreatorApplications,
  getCampaignApplications,
  reviewApplication,
} from "../services/application.service.js";

const apply = async (req, res) => {
  const application = await applyToCampaign({
    campaignId: req.params.campaignId,
    creatorId: req.user.userId,
    message: req.body.message,
  });

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: {
      application,
    },
  });
};

const getMyApplications = async (req, res) => {
  const applications = await getCreatorApplications(req.user.userId);

  res.status(200).json({
    success: true,
    results: applications.length,
    data: {
      applications,
    },
  });
};

const getApplicationsForCampaign = async (req, res) => {
  const applications = await getCampaignApplications({
    campaignId: req.params.campaignId,
    brandId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    results: applications.length,
    data: {
      applications,
    },
  });
};

const review = async (req, res) => {
  const application = await reviewApplication({
    applicationId: req.params.applicationId,
    brandId: req.user.userId,
    decision: req.body.decision,
  });

  res.status(200).json({
    success: true,
    message: `Application ${application.status.toLowerCase()} successfully`,
    data: {
      application,
    },
  });
};

export { apply, getMyApplications, getApplicationsForCampaign, review };

const getBrandApplications = async (
  req,
  res,
  next
) => {
  try {
    const brandId = req.user.userId;

    const campaigns =
      await Campaign.find({
        brandId,
      })
        .select(
          "_id title rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status"
        )
        .lean();

    const campaignIds =
      campaigns.map(
        (campaign) =>
          campaign._id
      );

    const applications =
      await Application.find({
        campaignId: {
          $in: campaignIds,
        },
      })
        .populate({
          path: "creatorId",
          select:
            "name email",
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

    const summary = {
      total:
        applications.length,

      pending:
        applications.filter(
          (item) =>
            item.status ===
            "PENDING"
        ).length,

      accepted:
        applications.filter(
          (item) =>
            item.status ===
            "ACCEPTED"
        ).length,

      rejected:
        applications.filter(
          (item) =>
            item.status ===
            "REJECTED"
        ).length,
    };

    return res.status(200).json({
      success: true,

      data: {
        summary,
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { getBrandApplications };
