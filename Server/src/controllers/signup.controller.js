import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { redisClient } from "../config/redis.js";
import AppError from "../utils/AppError.js";
import generateVerificationToken from "../utils/generateVerificationToken.js";
import hashToken from "../utils/hashToken.js";
import { sendVerificationEmail } from "../services/email.service.js";

const cookieName = "cocreateSignup";
const pendingCookieName = "cocreateSignupPending";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  path: "/api/auth/signup",
};
const emailSchema = z.string().trim().email().transform(value => value.toLowerCase());
const profileSchema = z.object({
  name: z.string().trim().min(2).max(50),
  password: z.string().min(8).max(72),
  confirmPassword: z.string(),
  role: z.enum(["CREATOR", "BRAND"]),
}).refine(value => value.password === value.confirmPassword, { message: "Passwords do not match" });
function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(result.error.issues.map(issue => issue.message).join(", "), 400);
  return result.data;
}

const publicRoles = ["CREATOR", "BRAND"];
const migrationFilter = ({ email, legacyUserId }) => ({
  _id: legacyUserId,
  email,
  emailVerified: false,
  status: "ACTIVE",
  role: { $in: publicRoles },
});

async function assertSignupAvailable(identity) {
  if (identity.legacyUserId) {
    if (await User.findOne(migrationFilter(identity))) return;
    throw new AppError("This account can no longer be completed. Please sign in or request a new signup link.", 409);
  }
  if (await User.exists({ email: identity.email })) {
    throw new AppError("Your account is already created. Please sign in.", 409);
  }
}

async function setupIdentity(req) {
  const token = req.cookies?.[cookieName];
  if (typeof token !== "string" || !token) {
    throw new AppError("Please verify your email again to complete your profile.", 401);
  }
  let identity;
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"], audience: "cocreate-profile-setup", issuer: "cocreate",
    });
    identity = {
      email: parse(emailSchema, payload.email),
      role: payload.role ? parse(z.enum(publicRoles), payload.role) : null,
      legacyUserId: payload.legacyUserId ? parse(z.string().regex(/^[a-f\d]{24}$/i), payload.legacyUserId) : null,
    };
  } catch {
    throw new AppError("Please verify your email again to complete your profile.", 401);
  }
  // Only the browser presenting the email token receives this authorization.
  // Requiring a server record also invalidates setup cookies issued before this fix.
  const setupKey = `cocreate:signup:setup:${hashToken(token)}`;
  const authorization = JSON.stringify(identity);
  if (await redisClient.get(setupKey) !== authorization) {
    throw new AppError("Please verify your email again to complete your profile.", 401);
  }
  return { ...identity, setupKey, authorization };
}

export async function startSignup(req, res) {
  const email = parse(emailSchema, req.body.email);
  const role = parse(z.enum(["CREATOR", "BRAND"]), req.body.role);
  const existing = await User.findOne({ email });
  // Unverified legacy accounts must prove email ownership again and choose a
  // fresh password. Never reactivate verified, moderated, or admin accounts here.
  if (existing && (existing.emailVerified || existing.status !== "ACTIVE" || !publicRoles.includes(existing.role))) {
    throw new AppError("An account with this email already exists. Please sign in.", 409);
  }
  const legacyUserId = existing ? String(existing._id) : null;
  const emailKey = hashToken(email);
  const cooldownKey = `cocreate:signup:cooldown:${emailKey}`;
  const acquired = await redisClient.set(cooldownKey, "1", { EX: 60, NX: true });
  if (!acquired) {
    const retryAfter = Math.max(1, await redisClient.ttl(cooldownKey));
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({ success: false, message: `Please wait ${retryAfter} seconds before requesting another email.`, data: { retryAfter } });
  }
  const { token, tokenHash } = generateVerificationToken();
  const pendingSecret = crypto.randomBytes(32).toString("hex");
  const pendingKey = `cocreate:signup:pending:${hashToken(pendingSecret)}`;
  const tokenKey = `cocreate:signup:token:${tokenHash}`;
  await redisClient.set(tokenKey, JSON.stringify({ email, role, legacyUserId, pendingKey }), { EX: 86400 });
  await redisClient.set(pendingKey, JSON.stringify({ email, role, verified: false }), { EX: 86400 });
  try {
    await sendVerificationEmail({ email, name: "there", token });
  } catch {
    await redisClient.del([tokenKey, cooldownKey, pendingKey]);
    throw new AppError("Unable to send verification email. Please try again.", 503);
  }
  res.clearCookie(cookieName, cookieOptions);
  res.cookie(pendingCookieName, pendingSecret, { ...cookieOptions, maxAge: 86400000 });
  res.status(200).json({ success: true, message: "Check your inbox to verify your email.", data: { email, role, retryAfter: 60 } });
}

export async function verifySignup(req, res) {
  const token = parse(z.string().regex(/^[a-f0-9]{64}$/), req.body.token);
  const pending = await redisClient.getDel(`cocreate:signup:token:${hashToken(token)}`);
  if (!pending) {
    throw new AppError("Verification link is invalid or has expired. Request a new signup link.", 400);
  }
  // Keep links issued before role selection was added usable.
  const { email, role, legacyUserId = null, pendingKey } = pending.startsWith("{") ? JSON.parse(pending) : { email: pending, role: null };
  const identity = { email, role: role || null, legacyUserId };
  await assertSignupAvailable(identity);
  const setupToken = jwt.sign(identity, process.env.JWT_ACCESS_SECRET, {
    algorithm: "HS256", expiresIn: "30m", audience: "cocreate-profile-setup", issuer: "cocreate", jwtid: crypto.randomUUID(),
  });
  await redisClient.set(`cocreate:signup:setup:${hashToken(setupToken)}`, JSON.stringify(identity), { EX: 1800 });
  res.cookie(cookieName, setupToken, { ...cookieOptions, maxAge: 30 * 60 * 1000 });
  if (pendingKey) {
    await redisClient.set(pendingKey, JSON.stringify({ email, role, verified: true }), { EX: 1800 });
  }
  res.json({ success: true, data: { email, profileRequired: true } });
}

export async function getSignupProfile(req, res) {
  const identity = await setupIdentity(req);
  const { email, role } = identity;
  await assertSignupAvailable(identity);
  res.json({ success: true, data: { email, role } });
}

export async function completeSignup(req, res) {
  const identity = await setupIdentity(req);
  const { email, role: selectedRole, legacyUserId, setupKey, authorization } = identity;
  const { name, password, role } = parse(profileSchema, { ...req.body, role: selectedRole || req.body.role });
  await assertSignupAvailable(identity);
  const hashedPassword = await bcrypt.hash(password, 12);
  // Consume atomically before creating the account so concurrent requests cannot
  // reuse this authorization. A failed database write requires a new email link.
  if (await redisClient.getDel(setupKey) !== authorization) {
    throw new AppError("Please verify your email again to complete your profile.", 401);
  }
  const profile = { name, password: hashedPassword, role, emailVerified: true, emailVerifiedAt: new Date() };
  if (legacyUserId) {
    const updated = await User.findOneAndUpdate(migrationFilter(identity), { $set: profile }, { new: true, runValidators: true });
    if (!updated) throw new AppError("This account has changed. Please sign in or request a new signup link.", 409);
  } else {
    await User.create({ ...profile, email });
  }
  res.clearCookie(cookieName, cookieOptions);
  res.clearCookie(pendingCookieName, cookieOptions);
  res.status(201).json({ success: true, message: "Profile created. You can now sign in." });
}
