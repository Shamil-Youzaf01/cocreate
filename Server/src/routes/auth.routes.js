import express from "express";
import { startSignup, verifySignup, getSignupProfile, completeSignup } from "../controllers/signup.controller.js";

import {
  login,
  getMe,
  refresh,
  logout,
} from "../controllers/auth.controller.js";

import protect from "../middlewares/auth.middleware.js";
import {
  registerLimiter,
  loginLimiter,
} from "../middlewares/rateLimit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { loginSchema } from "../validations/auth.validation.js";
import requireTrustedAuthRequest from "../middlewares/csrf.middleware.js";

const router = express.Router();

const retiredRegistration = (req, res) => res.status(410).json({
  success: false,
  message: "This registration flow has been retired. Request a new link through signup and choose a new password.",
});
router.post("/register", retiredRegistration);
router.get("/verify-email/:token", retiredRegistration);
router.post("/resend-verification", retiredRegistration);

router.use(requireTrustedAuthRequest);

router.post("/signup/start", registerLimiter, startSignup);
router.post("/signup/verify", registerLimiter, verifySignup);
router.get("/signup/profile", getSignupProfile);
router.post("/signup/profile", registerLimiter, completeSignup);

router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", protect, getMe);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
