import express from "express";

import {
  listUsers,
  getAdminCampaigns,
  changeUserStatus,
  moderateCampaignStatus,
} from "../controllers/admin.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.use(protect, authorize("ADMIN"));
router.get("/users", listUsers);
router.get("/campaigns", getAdminCampaigns);
router.patch("/users/:userId/status", changeUserStatus);
router.patch("/campaigns/:campaignId/moderate", moderateCampaignStatus);

export default router;
