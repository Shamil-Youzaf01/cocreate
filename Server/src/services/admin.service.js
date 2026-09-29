import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import AppError from "../utils/AppError.js";
import { deleteUserSessions } from "./session.service.js";
import {
  getPagination,
  getSort,
  buildSearchFilter,
  buildPaginationResponse,
} from "../utils/query.js";

const getUsers = async ({ role, status, search, page, limit, sort }) => {
  const pagination = getPagination({
    page,
    limit,
  });

  const filter = {};

  if (role) {
    const allowedRoles = ["CREATOR", "BRAND", "ADMIN"];

    if (!allowedRoles.includes(role)) {
      throw new AppError("Invalid user role", 400);
    }

    filter.role = role;
  }

  if (status) {
    const allowedStatuses = ["ACTIVE", "SUSPENDED", "BANNED"];

    if (!allowedStatuses.includes(status)) {
      throw new AppError("Invalid user status", 400);
    }

    filter.status = status;
  }

  Object.assign(filter, buildSearchFilter(search, ["name", "email"]));

  const sortOption = getSort(
    { sort },
    ["createdAt", "name", "email"],
    "-createdAt",
  );

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort(sortOption)
      .skip(pagination.skip)
      .limit(pagination.limit),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: buildPaginationResponse({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
  };
};

const updateUserStatus = async ({ userId, adminId, status }) => {
  const allowedStatuses = ["ACTIVE", "SUSPENDED", "BANNED"];

  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid user status", 400);
  }

  if (userId === adminId) {
    throw new AppError("You cannot change your own account status", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === "ADMIN") {
    throw new AppError(
      "Admin accounts cannot be moderated through this endpoint",
      403,
    );
  }

  user.status = status;

  await user.save();

  if (status === "SUSPENDED" || status === "BANNED") {
    await deleteUserSessions(user._id);
  }

  return user;
};

const moderateCampaign = async ({ campaignId, action }) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new AppError("Campaign not found", 404);
  }

  if (action !== "CLOSE") {
    throw new AppError("Invalid campaign moderation action", 400);
  }

  if (["CLOSED", "COMPLETED"].includes(campaign.status)) {
    throw new AppError("Campaign is already closed", 400);
  }

  campaign.status = "CLOSED";

  await campaign.save();

  return campaign;
};

export { getUsers, updateUserStatus, moderateCampaign };
