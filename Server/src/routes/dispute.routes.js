import express from "express";

import {
  create,
  getMyDisputes,
  getDisputes,
  startReview,
  resolve,
} from "../controllers/dispute.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("CREATOR", "BRAND"), create);

router.get("/my", protect, authorize("CREATOR", "BRAND"), getMyDisputes);

router.get("/admin", protect, authorize("ADMIN"), getDisputes);

router.patch("/:disputeId/review", protect, authorize("ADMIN"), startReview);

router.patch("/:disputeId/resolve", protect, authorize("ADMIN"), resolve);

export default router;
