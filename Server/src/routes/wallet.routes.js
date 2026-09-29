import express from "express";

import {
  getMyWallet,
  getMyTransactions,
} from "../controllers/wallet.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.get("/me", protect, authorize("CREATOR"), getMyWallet);

router.get("/transactions", protect, authorize("CREATOR"), getMyTransactions);

export default router;
