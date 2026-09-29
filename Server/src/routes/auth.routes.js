import express from "express";

import {
  register,
  verifyUserEmail,
  resendVerificationEmail,
  login,
  getMe,
  refresh,
  logout,
} from "../controllers/auth.controller.js";

import protect from "../middlewares/auth.middleware.js";
import {
  registerLimiter,
  resendVerificationLimiter,
  loginLimiter,
} from "../middlewares/rateLimit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

const router = express.Router();

router.post("/register", registerLimiter, validate(registerSchema), register);
router.get("/verify-email/:token", verifyUserEmail);
router.post(
  "/resend-verification",
  resendVerificationLimiter,
  resendVerificationEmail,
);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", protect, getMe);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
