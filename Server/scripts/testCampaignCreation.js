import "dotenv/config";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { generateAccessToken } from "../src/utils/generateTokens.js";

const payload = {
  title: "Performance Reel Campaign",
  description: "Create a short-form product reel.",
  requirements: "Original content only.",
  platform: "INSTAGRAM",
  contentType: "REEL",
  campaignBudget: 10000,
  rewardRatePerThousandViews: 200,
  minimumPayout: 800,
  maximumPayoutPerCreator: 2500,
  creatorSlots: 10,
  deadline: "2026-12-15T23:59:59.000Z",
};

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const brand = await User.findOne({ role: "BRAND", status: "ACTIVE" });
  assert.ok(brand, "An active brand account is required for this HTTP test.");
  const accessToken = generateAccessToken(brand);
  const cases = [
    { name: "Valid campaign", body: payload, status: 201 },
    { name: "Minimum exceeds maximum", body: { ...payload, minimumPayout: 3000, maximumPayoutPerCreator: 2000 }, status: 400, message: "Minimum payout cannot exceed maximum payout per creator." },
    { name: "Maximum exceeds budget", body: { ...payload, campaignBudget: 1000, minimumPayout: 500 }, status: 400, message: "Maximum payout per creator cannot exceed campaign budget." },
  ];
  let failures = 0;
  for (const item of cases) {
    if (process.argv.includes("--invalid-only") && item.status === 201) continue;
    const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(item.body),
    });
    const result = await response.json();
    console.log(`${item.name}: HTTP ${response.status}`);
    try {
      assert.equal(response.status, item.status);
      if (item.message) assert.equal(result.message, item.message);
      else {
        const campaign = result.data.campaign;
        for (const field of ["campaignBudget", "rewardRatePerThousandViews", "minimumPayout", "maximumPayoutPerCreator", "creatorSlots"]) assert.equal(campaign[field], payload[field]);
        assert.equal(campaign.status, "DRAFT");
        assert.equal(campaign.brandId, brand._id.toString());
        assert.equal("reward" in campaign, false);
        assert.equal("maxCreators" in campaign, false);
        console.log(`Created campaign: ${campaign._id}`);
      }
      console.log("PASS");
    } catch (error) {
      failures += 1;
      console.log(`FAIL: ${error.message}; API message: ${result.message}`);
    }
  }
  if (failures) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
