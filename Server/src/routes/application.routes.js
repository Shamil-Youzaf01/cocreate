import { getBrandApplications } from "../controllers/application.controller.js";
import express from "express";

import {
  apply,
  getMyApplications,
  getApplicationsForCampaign,
  review,
} from "../controllers/application.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.get("/brand/my", protect, authorize("BRAND"), getBrandApplications);

router.post(
  "/campaigns/:campaignId/apply",
  protect,
  authorize("CREATOR"),
  apply,
);

router.get("/my", protect, authorize("CREATOR"), getMyApplications);

router.get(
  "/campaigns/:campaignId",
  protect,
  authorize("BRAND"),
  getApplicationsForCampaign,
);

router.patch("/:applicationId/review", protect, authorize("BRAND"), review);

export default router;
