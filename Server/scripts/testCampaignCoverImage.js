import "dotenv/config";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Campaign from "../src/models/Campaign.js";
import { generateAccessToken } from "../src/utils/generateTokens.js";
import { createCampaignSchema } from "../src/validations/campaign.validation.js";

const coverImage = { url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b", publicId: "" };
const payload = { title: "Summer Creator Campaign", coverImage, description: "Create a lifestyle reel for our summer campaign.", requirements: "Original vertical short-form content.", platform: "INSTAGRAM", contentType: "REEL", campaignBudget: 10000, rewardRatePerThousandViews: 200, minimumPayout: 800, maximumPayoutPerCreator: 2500, creatorSlots: 10, deadline: "2026-12-15T23:59:59.000Z" };
let campaignId;
try {
  const base = `http://localhost:${process.env.PORT || 5000}/api/campaigns`;
  assert.equal((await fetch(new URL("/", base))).status, 200);
  await mongoose.connect(process.env.MONGODB_URI);
  const brand = await User.findOne({ role: "BRAND", status: "ACTIVE" });
  assert.ok(brand, "An active Brand account is required.");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${generateAccessToken(brand)}` };
  const request = async (path, method = "GET", body, expected = 200) => {
    const response = await fetch(`${base}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${result.message}`);
    return result.data;
  };
  const { coverImage: ignored, ...withoutImage } = payload;
  assert.equal(createCampaignSchema.safeParse({ body: withoutImage }).success, true);
  assert.equal(createCampaignSchema.safeParse({ body: { ...payload, coverImage: { url: "", publicId: "" } } }).success, true);
  console.log("PASS: Optional and empty cover images validate");
  await request("", "POST", { ...payload, coverImage: { url: "not-a-url" } }, 400);
  console.log("PASS: Invalid create URL returns 400");
  const created = await request("", "POST", payload, 201);
  campaignId = created.campaign._id;
  assert.deepEqual(created.campaign.coverImage, coverImage);
  console.log(`PASS: Created campaign ${campaignId} with cover image`);
  await request(`/${campaignId}`, "PATCH", { coverImage: { url: "not-a-url" } }, 400);
  const cleared = await request(`/${campaignId}`, "PATCH", { coverImage: { url: "", publicId: "" } });
  assert.equal(cleared.campaign.coverImage.url, "");
  const edited = await request(`/${campaignId}`, "PATCH", { coverImage });
  assert.deepEqual(edited.campaign.coverImage, coverImage);
  const unchanged = await request(`/${campaignId}`, "PATCH", { title: payload.title });
  assert.deepEqual(unchanged.campaign.coverImage, coverImage);
  console.log("PASS: Edit rejects invalid URL, clears/restores image, and preserves image when omitted");
  const mine = await request("/my");
  assert.deepEqual(mine.campaigns.find(item => item._id === campaignId).coverImage, coverImage);
  await request(`/${campaignId}/publish`, "PATCH");
  const published = await request("/published?search=Summer%20Creator%20Campaign");
  assert.deepEqual(published.campaigns.find(item => item._id === campaignId).coverImage, coverImage);
  const detail = await request(`/${campaignId}`);
  assert.deepEqual(detail.campaign.coverImage, coverImage);
  const stored = await Campaign.collection.findOne({ _id: new mongoose.Types.ObjectId(campaignId) });
  assert.deepEqual(stored.coverImage, coverImage);
  console.log("PASS: My, published, detail APIs and MongoDB retain url/publicId");
} catch (error) {
  console.error(error.message);
  if (campaignId) console.error(`Test campaign retained: ${campaignId}`);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
