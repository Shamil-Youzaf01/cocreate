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

    coverImage: {
      url: {
        type: String,
        trim: true,
        default: "",
      },
      publicId: {
        type: String,
        trim: true,
        default: "",
      },
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

    campaignBudget: {
      type: Number,
      required: true,
      min: [1, "Campaign budget must be greater than 0"],
    },

    rewardRatePerThousandViews: {
      type: Number,
      required: true,
      min: [1, "Reward rate must be greater than 0"],
    },

    minimumPayout: {
      type: Number,
      required: true,
      min: [0, "Minimum payout cannot be negative"],
    },

    maximumPayoutPerCreator: {
      type: Number,
      required: true,
      min: [1, "Maximum payout must be greater than 0"],
    },

    creatorSlots: {
      type: Number,
      min: [1, "Creator slots must be at least 1"],
      default: null,
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

campaignSchema.pre("validate", function () {
  if (this.minimumPayout > this.maximumPayoutPerCreator) {
    throw new Error("Minimum payout cannot exceed maximum payout per creator.");
  }

  if (this.maximumPayoutPerCreator > this.campaignBudget) {
    throw new Error("Maximum payout per creator cannot exceed campaign budget.");
  }
});

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
