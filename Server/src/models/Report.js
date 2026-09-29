import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetType: {
      type: String,
      enum: ["USER", "CAMPAIGN", "SUBMISSION"],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      enum: [
        "SPAM",
        "INAPPROPRIATE_CONTENT",
        "FRAUD",
        "HARASSMENT",
        "MISLEADING",
        "OTHER",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"],
      default: "OPEN",
      index: true,
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
reportSchema.index({
  reporterId: 1,
  createdAt: -1,
});

reportSchema.index({
  status: 1,
  targetType: 1,
  createdAt: -1,
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
