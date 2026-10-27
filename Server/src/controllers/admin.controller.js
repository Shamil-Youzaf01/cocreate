import Campaign from "../models/Campaign.js";
import { getPagination, buildSearchFilter, buildPaginationResponse } from "../utils/query.js";
import AppError from "../utils/AppError.js";

import {
  getUsers,
  updateUserStatus,
  moderateCampaign,
} from "../services/admin.service.js";

const listUsers = async (req, res) => {
  const result = await getUsers({
    role: req.query.role,
    status: req.query.status,
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
    sort: req.query.sort,
  });

  res.status(200).json({
    success: true,
    results: result.users.length,
    pagination: result.pagination,
    data: {
      users: result.users,
    },
  });
};

const changeUserStatus = async (req, res) => {
  const { status } = req.body;

  if (!status) {
    throw new AppError("User status is required", 400);
  }

  const user = await updateUserStatus({
    userId: req.params.userId,
    adminId: req.user.userId,
    status,
  });

  res.status(200).json({
    success: true,
    message: "User status updated successfully",
    data: {
      user,
    },
  });
};

const moderateCampaignStatus = async (req, res) => {
  const { action } = req.body;

  const campaign = await moderateCampaign({
    campaignId: req.params.campaignId,
    action,
  });

  res.status(200).json({
    success: true,
    message: "Campaign moderated successfully",
    data: {
      campaign,
    },
  });
};

export { listUsers, changeUserStatus, moderateCampaignStatus };

export const getAdminCampaigns = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    if (status && !["DRAFT", "PUBLISHED", "CLOSED", "COMPLETED"].includes(status)) throw new AppError("Invalid campaign status", 400);
    if (search !== undefined && typeof search !== "string") throw new AppError("Invalid search", 400);
    const pagination = getPagination({ ...req.query, limit: req.query.limit || 20 });
    const filter = { ...buildSearchFilter(search, ["title"]), ...(status ? { status } : {}) };
    const [campaigns, total] = await Promise.all([
      Campaign.find(filter).populate("brandId", "name email status").sort({ createdAt: -1, _id: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
      Campaign.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { campaigns, pagination: buildPaginationResponse({ ...pagination, total }) } });
  } catch (error) { next(error); }
};
