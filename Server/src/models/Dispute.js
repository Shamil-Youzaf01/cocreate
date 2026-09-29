import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },

    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      default: null,
    },

    category: {
      type: String,
      enum: [
        "PAYMENT",
        "SUBMISSION",
        "CAMPAIGN_REQUIREMENTS",
        "REWARD",
        "OTHER",
      ],
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"],
      default: "OPEN",
      index: true,
    },

    resolution: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
disputeSchema.index({
  raisedBy: 1,
  createdAt: -1,
});

disputeSchema.index({
  status: 1,
  createdAt: -1,
});

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;
