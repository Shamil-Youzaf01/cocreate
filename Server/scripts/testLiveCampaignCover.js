import "dotenv/config";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { generateAccessToken } from "../src/utils/generateTokens.js";

let campaignId;
const uploadedIds = [];
try {
  await mongoose.connect(process.env.MONGODB_URI);
  const brand = await User.findOne({ role: "BRAND", status: "ACTIVE" });
  assert.ok(brand, "Active brand required");
  const base = `http://localhost:${process.env.PORT || 5000}/api/campaigns`;
  const headers = { Authorization: `Bearer ${generateAccessToken(brand)}` };
  async function request(path, method = "GET", body, expected = 200) {
    const response = await fetch(`${base}${path}`, { method, headers: body instanceof FormData ? headers : { ...headers, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }) });
    const result = await response.json();
    assert.equal(response.status, expected, result.message);
    return result.data;
  }
  async function upload() {
    // A tiny PNG fixture; Cloudinary applies the production cover transformation.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
    const form = new FormData();
    form.append("cover", new Blob([png], { type: "image/png" }), "cover-checkpoint.png");
    const result = await request("/upload-cover", "POST", form);
    assert.match(result.coverImage.url, /^https:\/\/res\.cloudinary\.com\//);
    assert.match(result.coverImage.publicId, /^cocreate\/campaigns\//);
    uploadedIds.push(result.coverImage.publicId);
    return result.coverImage;
  }
  const cover = await upload();
  console.log("PASS: Real multipart upload returned a Cloudinary URL and public ID");
  const created = await request("", "POST", { title: "Campaign Cover Upload Checkpoint", coverImage: cover, description: "Live campaign cover upload and replacement checkpoint.", requirements: "Original vertical short-form content.", platform: "INSTAGRAM", contentType: "REEL", campaignBudget: 10000, rewardRatePerThousandViews: 200, minimumPayout: 800, maximumPayoutPerCreator: 2500, creatorSlots: 10, deadline: "2026-12-15T23:59:59.000Z" }, 201);
  campaignId = created.campaign._id;
  assert.deepEqual(created.campaign.coverImage, cover);
  assert.deepEqual((await request(`/${campaignId}`)).campaign.coverImage, cover);
  console.log("PASS: Draft creation and edit-load API preserve original image");
  const replacement = await upload();
  assert.notEqual(replacement.publicId, cover.publicId);
  const edited = await request(`/${campaignId}`, "PATCH", { coverImage: replacement });
  assert.deepEqual(edited.campaign.coverImage, replacement);
  assert.deepEqual((await request("/my")).campaigns.find(item => item._id === campaignId).coverImage, replacement);
  console.log("PASS: Replacement image saved and returned by My Campaigns");
  await request(`/${campaignId}/publish`, "PATCH");
  const creator = await User.findOne({ role: "CREATOR", status: "ACTIVE" });
  assert.ok(creator, "Active creator required");
  const creatorHeaders = { Authorization: `Bearer ${generateAccessToken(creator)}` };
  for (const path of ["/published?search=Campaign%20Cover%20Upload%20Checkpoint", `/${campaignId}`]) {
    const response = await fetch(`${base}${path}`, { headers: creatorHeaders });
    assert.equal(response.status, 200);
    const { data } = await response.json();
    const campaign = data.campaign || data.campaigns.find(item => item._id === campaignId);
    assert.deepEqual(campaign.coverImage, replacement);
    assert.equal(campaign.rewardRatePerThousandViews, 200);
    assert.equal(campaign.remainingBudget, 10000);
  }
  console.log("PASS: Creator discovery and detail APIs return replacement cover, reward rate, and budget");
  console.log(`Published test campaign: ${campaignId}. Two Cloudinary test assets retained.`);
} catch (error) {
  console.error(error.message);
  console.error(JSON.stringify({ campaignId, uploadedIds }));
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
