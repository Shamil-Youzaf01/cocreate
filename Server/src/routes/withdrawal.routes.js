import express from "express";

import {
  createWithdrawal,
  getMyWithdrawals,
  getWithdrawals,
  approve,
  reject,
  markPaid,
} from "../controllers/withdrawal.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("CREATOR"), createWithdrawal);
router.get("/my", protect, authorize("CREATOR"), getMyWithdrawals);
router.get("/admin", protect, authorize("ADMIN"), getWithdrawals);
router.patch("/:withdrawalId/approve", protect, authorize("ADMIN"), approve);
router.patch("/:withdrawalId/reject", protect, authorize("ADMIN"), reject);
router.patch("/:withdrawalId/paid", protect, authorize("ADMIN"), markPaid);

export default router;
