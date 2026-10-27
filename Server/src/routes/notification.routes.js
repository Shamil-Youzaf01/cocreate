import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "../services/notification.service.js";

const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  const asOf = new Date().toISOString();
  const data = await listNotifications(req.user.userId, req.query);
  res.json({ success: true, data: { ...data, asOf } });
});

router.patch("/read-all", async (req, res) => {
  await markAllNotificationsRead(req.user.userId, req.body.before);
  res.json({ success: true });
});

router.patch("/:notificationId/read", async (req, res) => {
  await markNotificationRead(req.user.userId, req.params.notificationId);
  res.json({ success: true });
});

export default router;
