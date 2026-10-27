import express from "express";
import protect from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { updateProfileSchema } from "../validations/profile.validation.js";
import { updateMyProfile } from "../controllers/profile.controller.js";

const router = express.Router();
router.patch("/me", protect, validate(updateProfileSchema), updateMyProfile);
export default router;
