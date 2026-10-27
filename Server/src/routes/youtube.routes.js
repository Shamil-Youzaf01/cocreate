import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { testYouTubeVideo } from "../controllers/youtube.controller.js";

const router = express.Router();
router.post("/test-video", protect, testYouTubeVideo);

export default router;
