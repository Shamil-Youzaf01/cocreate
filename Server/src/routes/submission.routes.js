import { getBrandSubmissions } from "../controllers/submission.controller.js";
import express from "express";
import { verifySubmissionViews, creditSubmissionReward } from "../controllers/performanceReward.controller.js";

import {
  submitContent,
  getSubmissions,
  review,
  resubmit,
  getMySubmissions,
  getSubmissionById,
} from "../controllers/submission.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import { syncYouTubeSubmission } from "../services/youtubeTracking.service.js";

const router = express.Router();
router.post("/:submissionId/sync-views", protect, authorize("BRAND", "CREATOR"), async (req, res) => {
  const submission = await syncYouTubeSubmission({ submissionId: req.params.submissionId, user: req.user });
  res.json({ success: true, message: "YouTube views synced.", data: { submission } });
});

router.patch("/:submissionId/verify-views", protect, authorize("BRAND"), verifySubmissionViews);
router.post("/:submissionId/credit-reward", protect, authorize("BRAND"), creditSubmissionReward);

router.get("/brand/my", protect, authorize("BRAND"), getBrandSubmissions);

router.get("/my", protect, authorize("CREATOR"), getMySubmissions);

router.post(
  "/campaigns/:campaignId",
  protect,
  authorize("CREATOR"),
  submitContent,
);

router.get(
  "/campaigns/:campaignId",
  protect,
  authorize("BRAND"),
  getSubmissions,
);
router.patch("/:submissionId/review", protect, authorize("BRAND"), review);
router.patch(
  "/:submissionId/resubmit",
  protect,
  authorize("CREATOR"),
  resubmit,
);

router.get("/:submissionId", protect, getSubmissionById);

export default router;
