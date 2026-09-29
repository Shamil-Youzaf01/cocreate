import AppError from "../utils/AppError.js";
import {
  createSubmission,
  getCampaignSubmissions,
  reviewSubmission,
  resubmitContent,
} from "../services/submission.service.js";

const submitContent = async (req, res) => {
  const { contentUrl, caption } = req.body;

  if (!contentUrl) {
    throw new AppError("Content URL is required", 400);
  }

  const submission = await createSubmission({
    campaignId: req.params.campaignId,
    creatorId: req.user.userId,
    contentUrl,
    caption,
  });

  res.status(201).json({
    success: true,
    message: "Content submitted successfully",
    data: {
      submission,
    },
  });
};

const getSubmissions = async (req, res) => {
  const submissions = await getCampaignSubmissions({
    campaignId: req.params.campaignId,
    brandId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    results: submissions.length,
    data: {
      submissions,
    },
  });
};

const review = async (req, res) => {
  const { decision, feedback } = req.body;

  const submission = await reviewSubmission({
    submissionId: req.params.submissionId,
    brandId: req.user.userId,
    decision,
    feedback,
  });

  res.status(200).json({
    success: true,
    message: "Submission reviewed successfully",
    data: {
      submission,
    },
  });
};

const resubmit = async (req, res) => {
  const { contentUrl, caption } = req.body;

  if (!contentUrl) {
    throw new AppError("Content URL is required", 400);
  }

  const submission = await resubmitContent({
    submissionId: req.params.submissionId,
    creatorId: req.user.userId,
    contentUrl,
    caption,
  });

  res.status(200).json({
    success: true,
    message: "Content resubmitted successfully",
    data: {
      submission,
    },
  });
};

export { submitContent, getSubmissions, review, resubmit };
