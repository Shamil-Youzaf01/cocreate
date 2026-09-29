import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: [true, "Campaign description is required"],
      trim: true,
      maxlength: 3000,
    },

    requirements: {
      type: String,
      required: [true, "Campaign requirements are required"],
      trim: true,
      maxlength: 3000,
    },

    platform: {
      type: String,
      enum: ["INSTAGRAM", "YOUTUBE", "TIKTOK", "OTHER"],
      required: true,
    },

    contentType: {
      type: String,
      enum: ["VIDEO", "REEL", "POST", "STORY", "SHORT", "OTHER"],
      required: true,
    },

    reward: {
      type: Number,
      required: true,
      min: [0, "Reward cannot be negative"],
    },

    maxCreators: {
      type: Number,
      required: true,
      min: [1, "At least one creator is required"],
    },

    deadline: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CLOSED", "COMPLETED"],
      default: "DRAFT",
    },
  },
  {
    timestamps: true,
  },
);

campaignSchema.index({
  brandId: 1,
  status: 1,
  createdAt: -1,
});

campaignSchema.index({
  status: 1,
  deadline: 1,
  createdAt: -1,
});

campaignSchema.index({
  status: 1,
  platform: 1,
  contentType: 1,
});

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;
