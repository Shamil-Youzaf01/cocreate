import serializeUser from "../utils/serializeUser.js";
import AppError from "../utils/AppError.js";
import {
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../services/auth.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";
import User from "../models/User.js";
import { createSession } from "../services/session.service.js";
import {
  refreshTokenCookieOptions,
  clearRefreshTokenCookieOptions,
} from "../config/cookie.js";

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await loginUser({
    email,
    password,
  });

  const sessionId = await createSession(user._id);

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user, sessionId);

  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

  await User.findByIdAndUpdate(user._id, {
    lastLoginAt: new Date(),
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: serializeUser(user),
      accessToken,
    },
  });
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }
  res.status(200).json({
    success: true,
    data: {
      user: serializeUser(user),
    },
  });
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  const accessToken = await refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    data: {
      accessToken,
    },
  });
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  await logoutUser(refreshToken);

  res.clearCookie("refreshToken", clearRefreshTokenCookieOptions);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

export {
  login,
  getMe,
  refresh,
  logout,
};
