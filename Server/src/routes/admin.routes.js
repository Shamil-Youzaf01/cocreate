import express from "express";

import {
  listUsers,
  changeUserStatus,
  moderateCampaignStatus,
} from "../controllers/admin.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.use(protect, authorize("ADMIN"));
router.get("/users", listUsers);
router.patch("/users/:userId/status", changeUserStatus);
router.patch("/campaigns/:campaignId/moderate", moderateCampaignStatus);

export default router;
