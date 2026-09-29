import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [1, "Withdrawal amount must be greater than 0"],
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
      default: "PENDING",
      index: true,
    },

    paymentDetails: {
      method: {
        type: String,
        enum: ["BANK_TRANSFER", "UPI"],
        required: true,
      },

      accountName: {
        type: String,
        trim: true,
      },

      accountNumber: {
        type: String,
        trim: true,
      },

      ifsc: {
        type: String,
        trim: true,
      },

      upiId: {
        type: String,
        trim: true,
      },
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

withdrawalSchema.index({
  creatorId: 1,
  status: 1,
  createdAt: -1,
});

withdrawalSchema.index({
  status: 1,
  createdAt: -1,
});

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;
