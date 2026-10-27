import { notifyUser, notifyAdmins } from "./notification.service.js";
import mongoose from "mongoose";

import Withdrawal from "../models/Withdrawal.js";
import Wallet from "../models/Wallet.js";
import AppError from "../utils/AppError.js";
import Transaction from "../models/Transaction.js";

const requestWithdrawal = async ({ creatorId, amount, paymentDetails }) => {
  // 1. Validate withdrawal amount
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Withdrawal amount must be greater than 0", 400);
  }

  // 2. Validate payment method
  if (!paymentDetails?.method) {
    throw new AppError("Payment method is required", 400);
  }

  // 3. Validate UPI details
  if (paymentDetails.method === "UPI" && !paymentDetails.upiId) {
    throw new AppError("UPI ID is required", 400);
  }

  // 4. Validate bank transfer details
  if (paymentDetails.method === "BANK_TRANSFER") {
    if (
      !paymentDetails.accountName ||
      !paymentDetails.accountNumber ||
      !paymentDetails.ifsc
    ) {
      throw new AppError("Complete bank details are required", 400);
    }
  }

  // 5. Start transaction
  const session = await mongoose.startSession();

  try {
    let withdrawal;

    await session.withTransaction(async () => {
      // Find creator wallet
      const wallet = await Wallet.findOne({
        userId: creatorId,
      }).session(session);

      if (!wallet) {
        throw new AppError("Wallet not found", 404);
      }

      // Check available balance
      if (wallet.availableBalance < amount) {
        throw new AppError("Insufficient wallet balance", 400);
      }

      // Deduct available balance
      wallet.availableBalance -= amount;

      await wallet.save({ session });

      // Create withdrawal
      const withdrawals = await Withdrawal.create(
        [
          {
            creatorId,
            amount,
            paymentDetails,
          },
        ],
        { session },
      );

      withdrawal = withdrawals[0];
    });

    await notifyAdmins({ eventKey: `withdrawal:${withdrawal._id}:requested`, type: "WITHDRAWAL", title: "New withdrawal request", message: "A creator has requested a payout. Review the amount and payment details.", href: "/dashboard/withdrawals" });
    return withdrawal;
  } finally {
    await session.endSession();
  }
};

const getCreatorWithdrawals = async (creatorId) => {
  return Withdrawal.find({
    creatorId,
  }).sort({ createdAt: -1 });
};

const getAllWithdrawals = async ({ status }) => {
  const filter = {};

  if (status) {
    const allowedStatuses = ["PENDING", "APPROVED", "REJECTED", "PAID"];

    if (!allowedStatuses.includes(status)) {
      throw new AppError("Invalid withdrawal status", 400);
    }

    filter.status = status;
  }

  return Withdrawal.find(filter)
    .populate("creatorId", "name email")
    .sort({ createdAt: -1 });
};

const approveWithdrawal = async ({ withdrawalId, adminNote }) => {
  // Match the current state in the write so a stale approval cannot overwrite
  // a rejection that has already returned the reserved funds.
  const withdrawal = await Withdrawal.findOneAndUpdate(
    { _id: withdrawalId, status: "PENDING" },
    {
      $set: {
        status: "APPROVED",
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  );

  if (!withdrawal) {
    if (!(await Withdrawal.exists({ _id: withdrawalId }))) {
      throw new AppError("Withdrawal request not found", 404);
    }
    throw new AppError("Only pending withdrawals can be approved", 409);
  }

  await notifyUser({ recipientId: withdrawal.creatorId, eventKey: `withdrawal:${withdrawal._id}:approved`, type: "WITHDRAWAL", title: "Withdrawal approved", message: "Your withdrawal has been approved and is awaiting payment.", href: "/dashboard/withdrawals" });
  return withdrawal;
};

const rejectWithdrawal = async ({ withdrawalId, adminNote }) => {
  const session = await mongoose.startSession();

  try {
    let updatedWithdrawal;

    await session.withTransaction(async () => {
      const withdrawal =
        await Withdrawal.findById(withdrawalId).session(session);

      if (!withdrawal) {
        throw new AppError("Withdrawal request not found", 404);
      }

      if (withdrawal.status !== "PENDING") {
        throw new AppError("Only pending withdrawals can be rejected", 400);
      }

      const wallet = await Wallet.findOne({
        userId: withdrawal.creatorId,
      }).session(session);

      if (!wallet) {
        throw new AppError("Creator wallet not found", 404);
      }

      // Return reserved funds
      wallet.availableBalance += withdrawal.amount;

      await wallet.save({ session });

      withdrawal.status = "REJECTED";
      withdrawal.adminNote = adminNote || null;
      withdrawal.reviewedAt = new Date();

      await withdrawal.save({ session });

      updatedWithdrawal = withdrawal;
    });

    await notifyUser({ recipientId: updatedWithdrawal.creatorId, eventKey: `withdrawal:${updatedWithdrawal._id}:rejected`, type: "WITHDRAWAL", title: "Withdrawal rejected", message: "Your withdrawal was rejected. Reserved funds have been returned to your available balance.", href: "/dashboard/withdrawals" });
    return updatedWithdrawal;
  } finally {
    await session.endSession();
  }
};

const markWithdrawalPaid = async ({ withdrawalId, adminNote }) => {
  const session = await mongoose.startSession();

  try {
    let updatedWithdrawal;

    await session.withTransaction(async () => {
      const withdrawal =
        await Withdrawal.findById(withdrawalId).session(session);

      if (!withdrawal) {
        throw new AppError("Withdrawal request not found", 404);
      }

      if (withdrawal.status !== "APPROVED") {
        throw new AppError(
          "Only approved withdrawals can be marked as paid",
          400,
        );
      }

      const wallet = await Wallet.findOne({
        userId: withdrawal.creatorId,
      }).session(session);

      if (!wallet) {
        throw new AppError("Creator wallet not found", 404);
      }

      await Transaction.create(
        [
          {
            userId: withdrawal.creatorId,
            type: "WITHDRAWAL",
            amount: withdrawal.amount,
            direction: "DEBIT",
            status: "COMPLETED",
            description: "Wallet withdrawal",
          },
        ],
        { session },
      );

      wallet.totalWithdrawn += withdrawal.amount;

      await wallet.save({ session });

      withdrawal.status = "PAID";
      withdrawal.paidAt = new Date();

      if (adminNote) {
        withdrawal.adminNote = adminNote;
      }

      await withdrawal.save({ session });

      updatedWithdrawal = withdrawal;
    });

    await notifyUser({ recipientId: updatedWithdrawal.creatorId, eventKey: `withdrawal:${updatedWithdrawal._id}:paid`, type: "WITHDRAWAL", title: "Withdrawal paid", message: "Your payout has been marked as sent. Check your payment account for receipt.", href: "/dashboard/withdrawals" });
    return updatedWithdrawal;
  } finally {
    await session.endSession();
  }
};

export {
  requestWithdrawal,
  getCreatorWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
};
