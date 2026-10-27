import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Campaign from "../src/models/Campaign.js";
import Application from "../src/models/Application.js";
import Submission from "../src/models/Submission.js";
import Transaction from "../src/models/Transaction.js";
import Wallet from "../src/models/Wallet.js";
import { generateAccessToken } from "../src/utils/generateTokens.js";
import { createSubmission, resubmitContent } from "../src/services/submission.service.js";
import { runYouTubeTrackingBatch } from "../src/jobs/youtubeTracking.js";

// Real database and HTTP routes; controlled YouTube counts simulate view growth.
const nativeFetch = globalThis.fetch;
const originalKey = process.env.YOUTUBE_API_KEY;
const userIds = [];
const campaignIds = [];
let server;
let views = 5000;
let fail = false;
let base;
const videoId = "jNQXAC9IVRw";
globalThis.fetch = async (url, options) => {
  if (String(url).startsWith("https://www.googleapis.com/youtube/v3/videos")) {
    if (fail) throw new Error("Simulated YouTube outage");
    const id = new URL(url).searchParams.get("id");
    return { ok: true, json: async () => ({ items: [{ id, statistics: { viewCount: String(views) } }] }) };
  }
  return nativeFetch(url, options);
};
async function request(path, token, expected = 200, body, method = "POST") {
  const response = await nativeFetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body || {}), signal: AbortSignal.timeout(20000) });
  const json = await response.json();
  assert.equal(response.status, expected, `${path}: ${json.message}`);
  return json.data;
}
try {
  process.env.YOUTUBE_API_KEY ||= "test-only-key";
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  server = await new Promise(resolve => { const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); });
  base = `http://127.0.0.1:${server.address().port}/api/submissions`;
  async function user(role) {
    const record = await User.create({ name: `Tracking ${role}`, email: `${crypto.randomUUID()}@example.test`, password: crypto.randomBytes(32).toString("hex"), role, emailVerified: true });
    userIds.push(record._id);
    return { id: record._id, token: generateAccessToken(record) };
  }
  const brand = await user("BRAND");
  const creator = await user("CREATOR");
  const stranger = await user("BRAND");
  const campaign = await Campaign.create({ brandId: brand.id, title: "Temporary YouTube tracking flow", description: "Integration regression", requirements: "Original content", platform: "YOUTUBE", contentType: "VIDEO", campaignBudget: 10000, rewardRatePerThousandViews: 200, minimumPayout: 800, maximumPayoutPerCreator: 2500, deadline: new Date(Date.now() + 86400000), status: "PUBLISHED" });
  campaignIds.push(campaign._id);
  const application = await Application.create({ campaignId: campaign._id, creatorId: creator.id, status: "ACCEPTED" });
  const submission = await createSubmission({ campaignId: campaign._id, creatorId: creator.id, contentUrl: `https://youtu.be/${videoId}` });
  assert.equal(submission.platformTracking.baselineViews, 5000);
  const sync = `/${submission._id}/sync-views`;
  await request(sync, null, 401);
  await request(sync, stranger.token, 403);
  await request(sync, creator.token, 409);
  await Submission.updateOne({ _id: submission._id }, { $set: { status: "APPROVED" } });
  await request(`/${submission._id}/verify-views`, brand.token, 409, { verifiedViews: 999999 }, "PATCH");
  views = 8000;
  let synced = (await request(sync, creator.token)).submission;
  assert.equal(synced.verifiedViews, 3000);
  assert.equal(synced.calculatedReward, 600);
  assert.equal(synced.finalReward, 0);
  assert.equal(synced.rewardStatus, "NOT_ELIGIBLE");
  views = 4000;
  synced = (await request(sync, brand.token)).submission;
  assert.equal(synced.verifiedViews, 0, "view decreases cannot create negative earnings");
  views = 11000;
  synced = (await request(sync, brand.token)).submission;
  assert.equal(synced.verifiedViews, 6000);
  assert.equal(synced.platformTracking.baselineViews, 5000);
  assert.equal(synced.finalReward, 1200);
  assert.equal(synced.rewardStatus, "READY");
  assert.equal(await Transaction.countDocuments({ submissionId: submission._id }), 0);
  fail = true;
  await request(sync, creator.token, 502);
  const failed = await Submission.findById(submission._id);
  assert.equal(failed.platformTracking.syncStatus, "FAILED");
  assert.equal(failed.finalReward, 1200);
  fail = false;
  await request(sync, creator.token);
  const credit = await request(`/${submission._id}/credit-reward`, brand.token);
  assert.equal(credit.wallet.availableBalance, 1200);
  assert.equal(credit.wallet.totalEarned, 1200);
  assert.equal(credit.rewardsIssued, 1200);
  assert.equal(credit.remainingBudget, 8800);
  await request(`/${submission._id}/credit-reward`, brand.token, 409);
  await request(sync, creator.token, 409);
  assert.equal(await Transaction.countDocuments({ submissionId: submission._id, type: "CAMPAIGN_REWARD" }), 1);
  console.log("PASS: HTTP ownership, approval guard, baseline delta, minimum, view decrease, outage/retry, credit 1200, budget 8800, duplicate and post-credit sync blocked");

  // Revision replacement starts a fresh baseline; the same video keeps its baseline.
  const second = await user("CREATOR");
  await Application.create({ campaignId: campaign._id, creatorId: second.id, status: "ACCEPTED" });
  views = 5000;
  const other = await createSubmission({ campaignId: campaign._id, creatorId: second.id, contentUrl: `https://youtu.be/${videoId}` });
  await Submission.updateOne({ _id: other._id }, { $set: { status: "REVISION_REQUESTED" } });
  views = 25000;
  let revised = await resubmitContent({ submissionId: other._id, creatorId: String(second.id), contentUrl: `https://youtube.com/watch?v=${videoId}` });
  assert.equal(revised.platformTracking.baselineViews, 5000);
  await Submission.updateOne({ _id: other._id }, { $set: { status: "APPROVED" } });
  revised = (await request(`/${other._id}/sync-views`, second.token)).submission;
  assert.equal(revised.calculatedReward, 4000);
  assert.equal(revised.finalReward, 2500);
  await Submission.updateOne({ _id: other._id }, { $set: { "platformTracking.lastSyncedAt": new Date(Date.now() - 16 * 60000) } });
  const find = Submission.find;
  try {
    // Restrict the worker query to this fixture so simulated counts never touch real data.
    Submission.find = function (filter, ...args) { return find.call(this, { ...filter, _id: other._id }, ...args); };
    views = 12000;
    await runYouTubeTrackingBatch();
  } finally { Submission.find = find; }
  assert.equal((await Submission.findById(other._id)).verifiedViews, 7000);
  views = 25000;
  await request(`/${other._id}/sync-views`, second.token);
  console.log("PASS: scheduled batch updates an approved tracking submission");
  await Campaign.updateOne({ _id: campaign._id }, { $set: { campaignBudget: 3000 } });
  await request(`/${other._id}/credit-reward`, brand.token, 409);
  await Submission.updateOne({ _id: other._id }, { $set: { status: "REVISION_REQUESTED" } });
  views = 8400;
  revised = await resubmitContent({ submissionId: other._id, creatorId: String(second.id), contentUrl: "https://youtu.be/dQw4w9WgXcQ" });
  assert.equal(revised.platformTracking.externalMediaId, "dQw4w9WgXcQ");
  assert.equal(revised.platformTracking.baselineViews, 8400);
  assert.equal(revised.verifiedViews, 0);
  assert.equal(revised.finalReward, 0);
  console.log("PASS: maximum cap, insufficient budget, same-video revision preserves baseline, replacement video resets baseline and reward");
} finally {
  globalThis.fetch = nativeFetch;
  if (originalKey === undefined) delete process.env.YOUTUBE_API_KEY; else process.env.YOUTUBE_API_KEY = originalKey;
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    await Transaction.deleteMany({ campaignId: { $in: campaignIds } });
    await Wallet.deleteMany({ userId: { $in: userIds } });
    await Submission.deleteMany({ campaignId: { $in: campaignIds } });
    await Application.deleteMany({ campaignId: { $in: campaignIds } });
    await Campaign.deleteMany({ _id: { $in: campaignIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }
  await mongoose.disconnect();
  console.log("Temporary tracking fixtures removed");
}
