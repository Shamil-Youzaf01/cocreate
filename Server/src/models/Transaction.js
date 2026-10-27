import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["CAMPAIGN_REWARD", "WITHDRAWAL", "ADJUSTMENT"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
    },

    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true,
    },

    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      default: null,
    },

    description: {
      type: String,
      trim: true,
    },

    withdrawalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Withdrawal",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index(
  {
    withdrawalId: 1,
    type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      withdrawalId: { $type: "objectId" },
      type: "WITHDRAWAL",
    },
  },
);
transactionSchema.index({
  userId: 1,
  createdAt: -1,
});

transactionSchema.index({
  userId: 1,
  type: 1,
  createdAt: -1,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
