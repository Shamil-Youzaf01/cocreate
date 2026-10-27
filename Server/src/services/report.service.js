import { notifyUser, notifyAdmins } from "./notification.service.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import Submission from "../models/Submission.js";
import AppError from "../utils/AppError.js";

const validateTarget = async ({ targetType, targetId }) => {
  let target;

  switch (targetType) {
    case "USER":
      target = await User.findById(targetId);
      break;

    case "CAMPAIGN":
      target = await Campaign.findById(targetId);
      break;

    case "SUBMISSION":
      target = await Submission.findById(targetId);
      break;

    default:
      throw new AppError("Invalid report target type", 400);
  }

  if (!target) {
    throw new AppError("Reported resource not found", 404);
  }

  return target;
};

const createReport = async ({
  reporterId,
  targetType,
  targetId,
  reason,
  description,
}) => {
  await validateTarget({
    targetType,
    targetId,
  });

  if (targetType === "USER" && targetId.toString() === reporterId.toString()) {
    throw new AppError("You cannot report yourself", 400);
  }

  const existingReport = await Report.findOne({
    reporterId,
    targetType,
    targetId,
    status: {
      $in: ["OPEN", "UNDER_REVIEW"],
    },
  });

  if (existingReport) {
    throw new AppError(
      "You already have an active report for this resource",
      409,
    );
  }

  const report = await Report.create({
    reporterId,
    targetType,
    targetId,
    reason,
    description,
  });
  await notifyAdmins({ eventKey: `report:${report._id}:created`, type: "REPORT", title: "New report received", message: "A new report is waiting for admin review.", href: "/dashboard/reports" });
  return report;
};

const getUserReports = async (reporterId) => {
  return Report.find({
    reporterId,
  }).sort({
    createdAt: -1,
  });
};

const getAllReports = async ({ status, targetType }) => {
  const filter = {};

  if (status) {
    const allowedStatuses = ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"];

    if (!allowedStatuses.includes(status)) {
      throw new AppError("Invalid report status", 400);
    }

    filter.status = status;
  }

  if (targetType) {
    const allowedTargetTypes = ["USER", "CAMPAIGN", "SUBMISSION"];

    if (!allowedTargetTypes.includes(targetType)) {
      throw new AppError("Invalid target type", 400);
    }

    filter.targetType = targetType;
  }

  return Report.find(filter)
    .populate("reporterId", "name email role")
    .populate("reviewedBy", "name email")
    .sort({
      createdAt: -1,
    });
};

const updateReportStatus = async ({ reportId, adminId, status, adminNote }) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new AppError("Report not found", 404);
  }

  const allowedStatuses = ["UNDER_REVIEW", "RESOLVED", "DISMISSED"];

  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid report status", 400);
  }

  if (["RESOLVED", "DISMISSED"].includes(report.status)) {
    throw new AppError("This report has already been closed", 400);
  }

  report.status = status;
  report.adminNote = adminNote || null;
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();

  await report.save();
  await notifyUser({ recipientId: report.reporterId, eventKey: `report:${report._id}:${report.status}`, type: "REPORT", title: "Report status updated", message: `Your report is now ${report.status.toLowerCase().replaceAll("_", " ")}.`, href: "/dashboard/reports" });

  return report;
};

export { createReport, getUserReports, getAllReports, updateReportStatus };
