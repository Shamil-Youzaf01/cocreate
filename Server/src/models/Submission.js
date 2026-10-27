import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    contentUrl: {
      type: String,
      required: true,
      trim: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["SUBMITTED", "REVISION_REQUESTED", "APPROVED", "REJECTED"],
      default: "SUBMITTED",
    },

    reportedViews: {
      type: Number,
      min: 0,
      default: 0,
    },

    verifiedViews: {
      type: Number,
      min: 0,
      default: 0,
    },

    calculatedReward: {
      type: Number,
      min: 0,
      default: 0,
    },

    finalReward: {
      type: Number,
      min: 0,
      default: 0,
    },

    rewardStatus: {
      type: String,
      enum: ["NOT_ELIGIBLE", "PENDING_VERIFICATION", "READY", "CREDITED"],
      default: "PENDING_VERIFICATION",
    },

    platformTracking: {
      platform: {
        type: String,
        enum: ["YOUTUBE", "INSTAGRAM"],
        default: null,
      },
      externalMediaId: {
        type: String,
        trim: true,
        default: null,
      },
      baselineViews: {
        type: Number,
        min: 0,
        default: 0,
      },
      currentViews: {
        type: Number,
        min: 0,
        default: 0,
      },
      eligibleViews: {
        type: Number,
        min: 0,
        default: 0,
      },
      source: {
        type: String,
        enum: ["MANUAL", "YOUTUBE_API", "INSTAGRAM_API"],
        default: "MANUAL",
      },
      syncStatus: {
        type: String,
        enum: ["NOT_CONNECTED", "ACTIVE", "FAILED"],
        default: "NOT_CONNECTED",
      },
      lastSyncedAt: {
        type: Date,
        default: null,
      },
      lastSyncError: {
        type: String,
        default: null,
      },
    },

    viewsVerifiedAt: {
      type: Date,
      default: null,
    },

    rewardCreditedAt: {
      type: Date,
      default: null,
    },

    feedback: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
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

submissionSchema.index(
  {
    campaignId: 1,
    creatorId: 1,
  },
  {
    unique: true,
  },
);

submissionSchema.index({
  campaignId: 1,
  status: 1,
  createdAt: -1,
});

submissionSchema.index({
  creatorId: 1,
  status: 1,
  createdAt: -1,
});

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
