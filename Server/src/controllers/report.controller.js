import AppError from "../utils/AppError.js";

import {
  createReport,
  getUserReports,
  getAllReports,
  updateReportStatus,
} from "../services/report.service.js";

const create = async (req, res) => {
  const { targetType, targetId, reason, description } = req.body;

  if (!targetType || !targetId || !reason || !description) {
    throw new AppError("All report fields are required", 400);
  }

  const report = await createReport({
    reporterId: req.user.userId,
    targetType,
    targetId,
    reason,
    description,
  });

  res.status(201).json({
    success: true,
    message: "Report submitted successfully",
    data: {
      report,
    },
  });
};

const getMyReports = async (req, res) => {
  const reports = await getUserReports(req.user.userId);

  res.status(200).json({
    success: true,
    results: reports.length,
    data: {
      reports,
    },
  });
};

const getReports = async (req, res) => {
  const reports = await getAllReports({
    status: req.query.status,
    targetType: req.query.targetType,
  });

  res.status(200).json({
    success: true,
    results: reports.length,
    data: {
      reports,
    },
  });
};

const updateStatus = async (req, res) => {
  const { status, adminNote } = req.body;

  const report = await updateReportStatus({
    reportId: req.params.reportId,
    adminId: req.user.userId,
    status,
    adminNote,
  });

  res.status(200).json({
    success: true,
    message: "Report updated successfully",
    data: {
      report,
    },
  });
};

export { create, getMyReports, getReports, updateStatus };
