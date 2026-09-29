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
