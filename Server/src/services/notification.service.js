import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Application from "../models/Application.js";
import AppError from "../utils/AppError.js";

// Notifications must never turn a completed business action into a failed response.
export async function notifyUser({ recipientId, eventKey, type, title, message, href }) {
  try {
    await Notification.updateOne({ recipientId, eventKey }, {
      $setOnInsert: { recipientId, eventKey, type, title: title.slice(0, 160), message: message.slice(0, 1000), href, readAt: null },
    }, { upsert: true, runValidators: true });
  } catch (error) {
    if (error.code !== 11000) console.error("Notification delivery failed:", { eventKey, recipientId: String(recipientId), error: error.message });
  }
}

export async function notifyAdmins(notification) {
  try {
    const admins = await User.find({ role: "ADMIN", status: "ACTIVE" }).select("_id").lean();
    await Promise.all(admins.map(admin => notifyUser({ ...notification, recipientId: admin._id })));
  } catch (error) {
    console.error("Admin notification delivery failed:", error.message);
  }
}

export async function notifyCampaignClosed(campaign, notifyBrand = false) {
  try {
    const applications = await Application.find({ campaignId: campaign._id, status: "ACCEPTED" }).select("creatorId").lean();
    const recipients = [...new Set(applications.map(item => String(item.creatorId)))];
    if (notifyBrand) recipients.push(String(campaign.brandId));
    await Promise.all(recipients.map(recipientId => notifyUser({ recipientId, eventKey: `campaign:${campaign._id}:closed`, type: "CAMPAIGN", title: "Campaign closed", message: `${campaign.title} has been closed. Open the campaign to view its details.`, href: `/dashboard/campaigns/${campaign._id}` })));
  } catch (error) {
    console.error("Campaign notification delivery failed:", error.message);
  }
}

export async function listNotifications(userId, { page = 1, limit = 20 } = {}) {
  page = Number(page);
  limit = Number(limit);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
    throw new AppError("Invalid notification pagination", 400);
  }
  const filter = { recipientId: userId };
  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select("type title message href readAt createdAt").lean(),
    Notification.countDocuments({ ...filter, readAt: null }),
    Notification.countDocuments(filter),
  ]);
  return { notifications, unreadCount, pagination: { page, limit, total, hasNextPage: page * limit < total } };
}

export async function markNotificationRead(userId, notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) throw new AppError("Invalid notification ID", 400);
  const filter = { _id: notificationId, recipientId: userId };
  const notification = await Notification.findOne(filter);
  if (!notification) throw new AppError("Notification not found", 404);
  await Notification.updateOne({ ...filter, readAt: null }, { $set: { readAt: new Date() } });
}

export async function markAllNotificationsRead(userId, before) {
  const cutoff = new Date(before);
  if (!before || Number.isNaN(cutoff.getTime()) || cutoff > new Date()) throw new AppError("A valid notification cutoff is required", 400);
  await Notification.updateMany({ recipientId: userId, readAt: null, createdAt: { $lte: cutoff } }, { $set: { readAt: new Date() } });
}
