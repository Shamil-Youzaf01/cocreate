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
