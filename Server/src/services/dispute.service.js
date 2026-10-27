import { notifyUser, notifyAdmins } from "./notification.service.js";
import Dispute from "../models/Dispute.js";
import Campaign from "../models/Campaign.js";
import Application from "../models/Application.js";
import Submission from "../models/Submission.js";
import AppError from "../utils/AppError.js";

const createDispute = async ({
  userId,
  role,
  campaignId,
  applicationId,
  submissionId,
  category,
  subject,
  description,
}) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (role === "BRAND") {
    if (campaign.brandId.toString() !== userId.toString()) {
      throw new AppError(
        "You are not authorized to raise a dispute for this campaign",
        403,
      );
    }
  } else if (role === "CREATOR") {
    const application = await Application.findOne({
      campaignId,
      creatorId: userId,
    });

    if (!application) {
      throw new AppError("You are not a participant in this campaign", 403);
    }
  } else {
    throw new AppError("Only creators and brands can raise disputes", 403);
  }

  if (applicationId) {
    const application = await Application.findById(applicationId);

    if (
      !application ||
      application.campaignId.toString() !== campaignId.toString()
    ) {
      throw new AppError("Invalid application reference", 400);
    }

    if (
      role === "CREATOR" &&
      application.creatorId.toString() !== userId.toString()
    ) {
      throw new AppError(
        "You cannot dispute another creator's application",
        403,
      );
    }
  }

  if (submissionId) {
    const submission = await Submission.findById(submissionId);

    if (
      !submission ||
      submission.campaignId.toString() !== campaignId.toString()
    ) {
      throw new AppError("Invalid submission reference", 400);
    }

    if (
      role === "CREATOR" &&
      submission.creatorId.toString() !== userId.toString()
    ) {
      throw new AppError(
        "You cannot dispute another creator's submission",
        403,
      );
    }
  }

  const existingDispute = await Dispute.findOne({
    raisedBy: userId,
    campaignId,
    status: {
      $in: ["OPEN", "UNDER_REVIEW"],
    },
  });

  if (existingDispute) {
    throw new AppError(
      "You already have an active dispute for this campaign",
      409,
    );
  }

  const dispute = await Dispute.create({
    raisedBy: userId,
    campaignId,
    applicationId: applicationId || null,
    submissionId: submissionId || null,
    category,
    subject,
    description,
  });
  await notifyAdmins({ eventKey: `dispute:${dispute._id}:created`, type: "DISPUTE", title: "New dispute received", message: "A new dispute is waiting for admin review.", href: "/dashboard/disputes" });
  return dispute;
};

const getUserDisputes = async (userId) => {
  return Dispute.find({
    raisedBy: userId,
  })
    .populate("campaignId", "title status reward")
    .sort({
      createdAt: -1,
    });
};

const getAllDisputes = async ({ status }) => {
  const filter = {};

  if (status) {
    const allowedStatuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

    if (!allowedStatuses.includes(status)) {
      throw new AppError("Invalid dispute status", 400);
    }

    filter.status = status;
  }

  return Dispute.find(filter)
    .populate("raisedBy", "name email role")
    .populate("campaignId", "title reward status brandId")
    .populate("resolvedBy", "name email")
    .sort({
      createdAt: -1,
    });
};

const startDisputeReview = async ({ disputeId, adminId }) => {
  const dispute = await Dispute.findById(disputeId);

  if (!dispute) {
    throw new AppError("Dispute not found", 404);
  }

  if (dispute.status !== "OPEN") {
    throw new AppError("Only open disputes can be moved to review", 400);
  }

  dispute.status = "UNDER_REVIEW";
  dispute.resolvedBy = adminId;

  await dispute.save();
  await notifyUser({ recipientId: dispute.raisedBy, eventKey: `dispute:${dispute._id}:${dispute.status}`, type: "DISPUTE", title: "Dispute status updated", message: `Your dispute is now ${dispute.status.toLowerCase().replaceAll("_", " ")}.`, href: "/dashboard/disputes" });

  return dispute;
};

const resolveDispute = async ({ disputeId, adminId, decision, resolution }) => {
  const dispute = await Dispute.findById(disputeId);

  if (!dispute) {
    throw new AppError("Dispute not found", 404);
  }

  if (!["OPEN", "UNDER_REVIEW"].includes(dispute.status)) {
    throw new AppError("This dispute has already been closed", 400);
  }

  if (!["RESOLVED", "REJECTED"].includes(decision)) {
    throw new AppError("Decision must be RESOLVED or REJECTED", 400);
  }

  if (!resolution?.trim()) {
    throw new AppError("Resolution details are required", 400);
  }

  dispute.status = decision;
  dispute.resolution = resolution.trim();
  dispute.resolvedBy = adminId;
  dispute.resolvedAt = new Date();

  await dispute.save();
  await notifyUser({ recipientId: dispute.raisedBy, eventKey: `dispute:${dispute._id}:${dispute.status}`, type: "DISPUTE", title: "Dispute status updated", message: `Your dispute is now ${dispute.status.toLowerCase().replaceAll("_", " ")}.`, href: "/dashboard/disputes" });

  return dispute;
};

export {
  createDispute,
  getUserDisputes,
  getAllDisputes,
  startDisputeReview,
  resolveDispute,
};
