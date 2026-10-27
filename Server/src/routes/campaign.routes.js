import express from "express";

import {
  createCampaign,
  getMyCampaigns,
  getPublished,
  getCampaign,
  editCampaign,
  publish,
  close,
  uploadCampaignCover as uploadCampaignCoverController,
} from "../controllers/campaign.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { createCampaignSchema, updateCampaignSchema } from "../validations/campaign.validation.js";
import uploadCampaignCover from "../middlewares/campaignUpload.middleware.js";

const router = express.Router();

// CREATOR / AUTHENTICATED USERS
router.get("/published", protect, getPublished);

// BRAND
router.post("/upload-cover", protect, authorize("BRAND"), uploadCampaignCover.single("cover"), uploadCampaignCoverController);
router.get("/my", protect, authorize("BRAND"), getMyCampaigns);
router.post("/", protect, authorize("BRAND"), validate(createCampaignSchema), createCampaign);
router.patch("/:campaignId", protect, authorize("BRAND"), validate(updateCampaignSchema), editCampaign);
router.patch("/:campaignId/publish", protect, authorize("BRAND"), publish);
router.patch("/:campaignId/close", protect, authorize("BRAND"), close);

// AUTHENTICATED USERS
router.get("/:campaignId", protect, getCampaign);

export default router;
