import express from "express";

import {
  createCampaign,
  getMyCampaigns,
  getPublished,
  getCampaign,
  editCampaign,
  publish,
  close,
} from "../controllers/campaign.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

// CREATOR / AUTHENTICATED USERS
router.get("/published", protect, getPublished);

// BRAND
router.get("/my", protect, authorize("BRAND"), getMyCampaigns);
router.post("/", protect, authorize("BRAND"), createCampaign);
router.patch("/:campaignId", protect, authorize("BRAND"), editCampaign);
router.patch("/:campaignId/publish", protect, authorize("BRAND"), publish);
router.patch("/:campaignId/close", protect, authorize("BRAND"), close);

// AUTHENTICATED USERS
router.get("/:campaignId", protect, getCampaign);

export default router;
