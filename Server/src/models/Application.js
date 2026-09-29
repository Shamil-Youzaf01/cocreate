import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
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

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
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

// One creator can apply only once per campaign
applicationSchema.index(
  {
    campaignId: 1,
    creatorId: 1,
  },
  {
    unique: true,
  },
);

applicationSchema.index({
  creatorId: 1,
  status: 1,
  createdAt: -1,
});

applicationSchema.index({
  campaignId: 1,
  status: 1,
  createdAt: -1,
});

const Application = mongoose.model("Application", applicationSchema);

export default Application;
