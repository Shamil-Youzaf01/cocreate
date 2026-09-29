import AppError from "../utils/AppError.js";
import {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../services/auth.service.js";
import { sendVerificationEmail } from "../services/email.service.js";
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

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError("Name, email, password and role are required", 400);
  }

  const { user, verificationToken } = await registerUser({
    name,
    email,
    password,
    role,
  });

  try {
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
  }

  res.status(201).json({
    success: true,
    message:
      "Account created successfully. Please check your email to verify your account.",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        createdAt: user.createdAt,
      },
    },
  });
};

const verifyUserEmail = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  const user = await verifyEmail(token);

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    data: {
      user: {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    },
  });
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const { user, verificationToken } = await resendVerification(email);

  await sendVerificationEmail({
    email: user.email,
    name: user.name,
    token: verificationToken,
  });

  res.status(200).json({
    success: true,
    message: "Verification email resent successfully",
    data: {
      email: user.email,
    },
  });
};

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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
      },
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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        createdAt: user.createdAt,
      },
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
  register,
  verifyUserEmail,
  resendVerificationEmail,
  login,
  getMe,
  refresh,
  logout,
};
