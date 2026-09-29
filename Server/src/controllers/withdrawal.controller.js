import AppError from "../utils/AppError.js";

import {
  requestWithdrawal,
  getCreatorWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
} from "../services/withdrawal.service.js";

const createWithdrawal = async (req, res) => {
  const amount = Number(req.body.amount);
  const { paymentDetails } = req.body;

  if (!req.body.amount || !paymentDetails) {
    throw new AppError("Amount and payment details are required", 400);
  }

  const withdrawal = await requestWithdrawal({
    creatorId: req.user.userId,
    amount,
    paymentDetails,
  });

  res.status(201).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    data: {
      withdrawal,
    },
  });
};

const getMyWithdrawals = async (req, res) => {
  const withdrawals = await getCreatorWithdrawals(req.user.userId);

  res.status(200).json({
    success: true,
    results: withdrawals.length,
    data: {
      withdrawals,
    },
  });
};

const getWithdrawals = async (req, res) => {
  const withdrawals = await getAllWithdrawals({
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    results: withdrawals.length,
    data: {
      withdrawals,
    },
  });
};

const approve = async (req, res) => {
  const withdrawal = await approveWithdrawal({
    withdrawalId: req.params.withdrawalId,
    adminNote: req.body.adminNote,
  });

  res.status(200).json({
    success: true,
    message: "Withdrawal approved successfully",
    data: { withdrawal },
  });
};

const reject = async (req, res) => {
  const withdrawal = await rejectWithdrawal({
    withdrawalId: req.params.withdrawalId,
    adminNote: req.body.adminNote,
  });

  res.status(200).json({
    success: true,
    message: "Withdrawal rejected successfully",
    data: { withdrawal },
  });
};

const markPaid = async (req, res) => {
  const withdrawal = await markWithdrawalPaid({
    withdrawalId: req.params.withdrawalId,
    adminNote: req.body.adminNote,
  });

  res.status(200).json({
    success: true,
    message: "Withdrawal marked as paid",
    data: { withdrawal },
  });
};

export {
  createWithdrawal,
  getMyWithdrawals,
  getWithdrawals,
  approve,
  reject,
  markPaid,
};
