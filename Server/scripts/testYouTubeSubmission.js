import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Campaign from "../src/models/Campaign.js";
import Application from "../src/models/Application.js";
import Submission from "../src/models/Submission.js";
import Transaction from "../src/models/Transaction.js";
import { generateAccessToken } from "../src/utils/generateTokens.js";

const base = `http://localhost:${process.env.PORT || 5000}/api`;
const userIds = [];
const campaignIds = [];
const runId = crypto.randomUUID();
async function request(path, token, method, body, expected = 200) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20000),
  });
  const json = await response.json();
  assert.equal(response.status, expected, `${path}: ${json.message}`);
  return json.data;
}
async function createUser(role) {
  const user = await User.create({ name: `YouTube Test ${role}`, email: `${role}-${runId}@example.test`, password: crypto.randomBytes(32).toString("hex"), role, emailVerified: true });
  userIds.push(user._id);
  return generateAccessToken(user);
}
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const brand = await createUser("BRAND");
  const creator = await createUser("CREATOR");
  for (const platform of ["YOUTUBE", "INSTAGRAM"]) {
    const { campaign } = await request("/campaigns", brand, "POST", {
      title: `${platform} baseline test`, description: "Temporary live integration test", requirements: "Submit original content",
      platform, contentType: "VIDEO", campaignBudget: 10000, rewardRatePerThousandViews: 200,
      minimumPayout: 800, maximumPayoutPerCreator: 2500, creatorSlots: 10, deadline: "2026-12-15T23:59:59.000Z",
    }, 201);
    campaignIds.push(campaign._id);
    await request(`/campaigns/${campaign._id}/publish`, brand, "PATCH");
    const { application } = await request(`/applications/campaigns/${campaign._id}/apply`, creator, "POST", { message: "Baseline test" }, 201);
    const path = `/submissions/campaigns/${campaign._id}`;
    await request(path, creator, "POST", { contentUrl: "https://youtu.be/jNQXAC9IVRw" }, 403);
    await request(`/applications/${application._id}/review`, brand, "PATCH", { decision: "ACCEPTED" });
    if (platform === "YOUTUBE") {
      await request(path, creator, "POST", { contentUrl: "https://example.com/video" }, 400);
      assert.equal(await Submission.countDocuments({ campaignId: campaign._id }), 0);
    }
    const { submission } = await request(path, creator, "POST", {
      contentUrl: platform === "YOUTUBE" ? "https://youtu.be/jNQXAC9IVRw" : "https://example.com/content",
    }, 201);
    const stored = await Submission.collection.findOne({ _id: new mongoose.Types.ObjectId(submission._id) });
    const tracking = stored.platformTracking;
    assert.equal(stored.verifiedViews, 0);
    assert.equal(stored.calculatedReward, 0);
    assert.equal(stored.finalReward, 0);
    assert.equal(tracking.eligibleViews, 0);
    assert.equal(await Transaction.countDocuments({ submissionId: stored._id }), 0);
    if (platform === "YOUTUBE") {
      assert.equal(tracking.platform, "YOUTUBE");
      assert.equal(tracking.externalMediaId, "jNQXAC9IVRw");
      assert.ok(tracking.baselineViews > 0);
      assert.equal(tracking.currentViews, tracking.baselineViews);
      assert.equal(tracking.source, "YOUTUBE_API");
      assert.equal(tracking.syncStatus, "ACTIVE");
      assert.ok(tracking.lastSyncedAt instanceof Date);
      assert.equal(tracking.lastSyncError, null);
      await request(`/submissions/${submission._id}/review`, brand, "PATCH", { decision: "APPROVED" });
      const synced = (await request(`/submissions/${submission._id}/sync-views`, creator, "POST")).submission;
      assert.equal(synced.platformTracking.baselineViews, tracking.baselineViews);
      assert.equal(synced.verifiedViews, Math.max(synced.platformTracking.currentViews - tracking.baselineViews, 0));
      assert.equal(synced.platformTracking.syncStatus, "ACTIVE");
      console.log(JSON.stringify({ liveYouTubeSync: "PASS", baseline: tracking.baselineViews, current: synced.platformTracking.currentViews, verifiedViews: synced.verifiedViews }));
    } else {
      assert.equal(tracking.platform, null);
      assert.equal(tracking.baselineViews, 0);
      assert.equal(tracking.source, "MANUAL");
      assert.equal(tracking.syncStatus, "NOT_CONNECTED");
    }
    await request(path, creator, "POST", { contentUrl: "https://youtu.be/jNQXAC9IVRw" }, 409);
    console.log(JSON.stringify({ result: "PASS", platform, httpStatus: 201, tracking, verifiedViews: stored.verifiedViews, finalReward: stored.finalReward }));
  }
} finally {
  if (mongoose.connection.readyState === 1) {
    await Submission.deleteMany({ campaignId: { $in: campaignIds } });
    await Application.deleteMany({ campaignId: { $in: campaignIds } });
    await Campaign.deleteMany({ _id: { $in: campaignIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    console.log("Temporary integration fixtures removed");
  }
  await mongoose.disconnect();
}
