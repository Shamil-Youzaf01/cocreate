import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { generateAccessToken } from "../utils/generateTokens.js";
import { getSession, deleteSession } from "./session.service.js";

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
  loginUser,
  refreshAccessToken,
  logoutUser,
};
