import express from "express";

import {
  submitContent,
  getSubmissions,
  review,
  resubmit,
} from "../controllers/submission.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

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

export default router;
