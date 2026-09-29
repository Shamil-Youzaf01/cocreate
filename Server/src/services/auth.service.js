import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import generateVerificationToken from "../utils/generateVerificationToken.js";
import hashToken from "../utils/hashToken.js";
import { generateAccessToken } from "../utils/generateTokens.js";
import {
  storeVerificationToken,
  getUserIdByVerificationToken,
  deleteVerificationToken,
  getResendCooldown,
  setResendCooldown,
} from "./emailVerification.service.js";
import { getSession, deleteSession } from "./session.service.js";

const registerUser = async ({ name, email, password, role }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const allowedRoles = ["CREATOR", "BRAND"];

  if (!allowedRoles.includes(role)) {
    throw new AppError("Invalid user role", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role,
  });

  const { token, tokenHash } = generateVerificationToken();

  await storeVerificationToken({
    userId: user._id.toString(),
    tokenHash,
  });

  return {
    user,
    verificationToken: token,
  };
};

const verifyEmail = async (token) => {
  const tokenHash = hashToken(token);

  const userId = await getUserIdByVerificationToken(tokenHash);

  if (!userId) {
    throw new AppError("Verification link is invalid or has expired", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    await deleteVerificationToken({
      userId,
      tokenHash,
    });

    throw new AppError("User not found", 404);
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();

  await user.save();

  await deleteVerificationToken({
    userId,
    tokenHash,
  });

  return user;
};

const resendVerification = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.emailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  const cooldown = await getResendCooldown(user._id.toString());

  if (cooldown > 0) {
    throw new AppError(
      `Please wait ${cooldown} seconds before requesting another verification email`,
      429,
    );
  }

  const { token, tokenHash } = generateVerificationToken();

  await storeVerificationToken({
    userId: user._id.toString(),
    tokenHash,
  });

  await setResendCooldown(user._id.toString());

  return {
    user,
    verificationToken: token,
  };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.emailVerified) {
    throw new AppError("Please verify your email before logging in", 403);
  }

  if (user.status === "SUSPENDED") {
    throw new AppError("Your account has been suspended", 403);
  }

  if (user.status === "BANNED") {
    throw new AppError("Your account has been banned", 403);
  }

  return user;
};

const refreshAccessToken = async (refreshToken) => {
  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const session = await getSession(decoded.sessionId);

  if (!session) {
    throw new AppError("Session has expired or has been revoked", 401);
  }

  if (session.userId !== decoded.userId) {
    throw new AppError("Invalid session", 401);
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("User not found", 401);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError("Account is not active", 403);
  }

  const accessToken = generateAccessToken(user);

  return accessToken;
};

const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    await deleteSession(decoded.sessionId);
  } catch (error) {
    // Invalid/expired token:
    // there is no trusted sessionId to revoke here.
  }
};

export {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
