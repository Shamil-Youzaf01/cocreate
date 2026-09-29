import AppError from "../utils/AppError.js";

import {
  createDispute,
  getUserDisputes,
  getAllDisputes,
  startDisputeReview,
  resolveDispute,
} from "../services/dispute.service.js";

const create = async (req, res) => {
  const {
    campaignId,
    applicationId,
    submissionId,
    category,
    subject,
    description,
  } = req.body;

  if (!campaignId || !category || !subject || !description) {
    throw new AppError(
      "Campaign, category, subject and description are required",
      400,
    );
  }

  const dispute = await createDispute({
    userId: req.user.userId,
    role: req.user.role,
    campaignId,
    applicationId,
    submissionId,
    category,
    subject,
    description,
  });

  res.status(201).json({
    success: true,
    message: "Dispute raised successfully",
    data: { dispute },
  });
};

const getMyDisputes = async (req, res) => {
  const disputes = await getUserDisputes(req.user.userId);

  res.status(200).json({
    success: true,
    results: disputes.length,
    data: { disputes },
  });
};

const getDisputes = async (req, res) => {
  const disputes = await getAllDisputes({
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    results: disputes.length,
    data: { disputes },
  });
};

const startReview = async (req, res) => {
  const dispute = await startDisputeReview({
    disputeId: req.params.disputeId,
    adminId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    message: "Dispute moved to review",
    data: { dispute },
  });
};

const resolve = async (req, res) => {
  const { decision, resolution } = req.body;

  const dispute = await resolveDispute({
    disputeId: req.params.disputeId,
    adminId: req.user.userId,
    decision,
    resolution,
  });

  res.status(200).json({
    success: true,
    message: "Dispute closed successfully",
    data: { dispute },
  });
};

export { create, getMyDisputes, getDisputes, startReview, resolve };
