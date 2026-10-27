import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  eventKey: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 1000 },
  href: { type: String, required: true, match: /^\/dashboard(?:\/|$)/ },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, eventKey: 1 }, { unique: true });
notificationSchema.index({ recipientId: 1, createdAt: -1, _id: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1 });

export default mongoose.model("Notification", notificationSchema);
