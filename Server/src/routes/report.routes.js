import express from "express";

import {
  create,
  getMyReports,
  getReports,
  updateStatus,
} from "../controllers/report.controller.js";

import protect from "../middlewares/auth.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.post("/", protect, create);

router.get("/my", protect, getMyReports);

router.get("/admin", protect, authorize("ADMIN"), getReports);

router.patch("/:reportId/status", protect, authorize("ADMIN"), updateStatus);

export default router;
