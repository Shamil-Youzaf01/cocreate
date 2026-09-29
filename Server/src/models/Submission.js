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
