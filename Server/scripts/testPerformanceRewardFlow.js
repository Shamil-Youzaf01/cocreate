import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Transaction from "../src/models/Transaction.js";
import { generateAccessToken } from "../src/utils/generateTokens.js";

const base = `http://localhost:${process.env.PORT || 5000}/api`;
const report = { checks: [] };
const pass = message => { report.checks.push(message); console.log(`PASS: ${message}`); };
async function request(path, token, method = "GET", body, expected = 200) {
  const response = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${result.message}`);
  return result.data;
}
try {
  assert.equal((await fetch(`http://localhost:${process.env.PORT || 5000}/`)).status, 200);
  await mongoose.connect(process.env.MONGODB_URI);
  const brand = await User.findOne({ role: "BRAND", status: "ACTIVE" });
  assert.ok(brand, "Active brand account required");
  // Dedicated test creator keeps existing creators' wallets untouched.
  const creator = await User.create({ name: "Reward Checkpoint Creator", email: `reward-checkpoint-${crypto.randomUUID()}@example.test`, password: crypto.randomBytes(32).toString("hex"), role: "CREATOR", emailVerified: true });
  const brandToken = generateAccessToken(brand);
  const creatorToken = generateAccessToken(creator);
  const created = await request("/campaigns", brandToken, "POST", { title: "Performance Reward Checkpoint", description: "Live HTTP checkpoint for verified-view rewards.", requirements: "Original content only.", platform: "INSTAGRAM", contentType: "REEL", campaignBudget: 10000, rewardRatePerThousandViews: 200, minimumPayout: 800, maximumPayoutPerCreator: 2500, creatorSlots: 10, deadline: "2026-12-15T23:59:59.000Z" }, 201);
  const campaignId = created.campaign._id;
  report.campaignId = campaignId;
  report.creatorId = String(creator._id);
  await request(`/campaigns/${campaignId}/publish`, brandToken, "PATCH");
  const applied = await request(`/applications/campaigns/${campaignId}/apply`, creatorToken, "POST", { message: "Original performance regression pitch" }, 201);
  assert.equal(applied.application.status, "PENDING");
  const accepted = await request(`/applications/${applied.application._id}/review`, brandToken, "PATCH", { decision: "ACCEPTED" });
  assert.equal(accepted.application.status, "ACCEPTED");
  pass("Creator applies and Brand accepts through HTTP");
  const submitted = await request(`/submissions/campaigns/${campaignId}`, creatorToken, "POST", { contentUrl: "https://example.test/reward-checkpoint", caption: "Reward checkpoint content" }, 201);
  const submissionId = submitted.submission._id;
  report.submissionId = submissionId;
  await request(`/submissions/${submissionId}/verify-views`, brandToken, "PATCH", { verifiedViews: 6000 }, 409);
  await request(`/submissions/${submissionId}/credit-reward`, brandToken, "POST", undefined, 409);
  const reviewed = await request(`/submissions/${submissionId}/review`, brandToken, "PATCH", { decision: "APPROVED" });
  assert.equal(reviewed.submission.rewardStatus, "PENDING_VERIFICATION");
  const before = await request("/wallet/me", creatorToken);
  assert.equal(before.wallet.availableBalance, 0);
  assert.equal(await Transaction.countDocuments({ submissionId, type: "CAMPAIGN_REWARD" }), 0);
  pass("Approved content: wallet 0; no reward transaction");
  for (const [views, raw, final, status] of [[3000, 600, 0, "NOT_ELIGIBLE"], [20000, 4000, 2500, "READY"], [6000, 1200, 1200, "READY"]]) {
    const verified = await request(`/submissions/${submissionId}/verify-views`, brandToken, "PATCH", { verifiedViews: views });
    assert.equal(verified.submission.calculatedReward, raw);
    assert.equal(verified.submission.finalReward, final);
    assert.equal(verified.submission.rewardStatus, status);
    pass(`${views} views: calculated ${raw}, final ${final}, ${status}`);
  }
  await request(`/submissions/${submissionId}/credit-reward`, creatorToken, "POST", undefined, 403);
  pass("Creator cannot credit a reward (403)");
  for (const verifiedViews of [-1, 1.5, "6000", null]) await request(`/submissions/${submissionId}/verify-views`, brandToken, "PATCH", { verifiedViews }, 400);
  const beforeCredit = await request(`/campaigns/${campaignId}`, brandToken);
  assert.deepEqual(beforeCredit.campaign.rewardOverview, { approvedCreators: 1, rewardsReady: 1, rewardsCredited: 0, totalVerifiedViews: 6000 });
  const credited = await request(`/submissions/${submissionId}/credit-reward`, brandToken, "POST");
  assert.equal(credited.reward, 1200);
  assert.equal(credited.wallet.availableBalance, 1200);
  assert.equal(credited.wallet.totalEarned, 1200);
  assert.equal(credited.rewardsIssued, 1200);
  assert.equal(credited.remainingBudget, 8800);
  pass("Credit: wallet +1200, issued 1200, remaining 8800");
  await request(`/submissions/${submissionId}/credit-reward`, brandToken, "POST", undefined, 409);
  const [duplicateA, duplicateB] = await Promise.all([
    request(`/submissions/${submissionId}/credit-reward`, brandToken, "POST", undefined, 409),
    request(`/submissions/${submissionId}/credit-reward`, brandToken, "POST", undefined, 409),
  ]);
  const transactions = await Transaction.find({ submissionId, type: "CAMPAIGN_REWARD" }).lean();
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].amount, 1200);
  assert.equal(String(transactions[0].campaignId), campaignId);
  const after = await request("/wallet/me", creatorToken);
  assert.equal(after.wallet.availableBalance, 1200);
  assert.equal(after.wallet.totalEarned, 1200);
  await request(`/submissions/${submissionId}/verify-views`, brandToken, "PATCH", { verifiedViews: 20000 }, 409);
  const performance = await request(`/submissions/${submissionId}`, creatorToken);
  assert.equal(performance.submission.creditedReward, 1200);
  assert.equal(performance.submission.rewardStatus, "CREDITED");
  pass("Repeated credit returns 409; exactly one reward transaction; wallet remains 1200");
  const detail = await request(`/campaigns/${campaignId}`, creatorToken);
  for (const campaign of [detail.campaign, (await request("/campaigns/my", brandToken)).campaigns.find(item => item._id === campaignId), (await request("/campaigns/published?search=Performance%20Reward%20Checkpoint", creatorToken)).campaigns.find(item => item._id === campaignId)]) {
    assert.equal(campaign.campaignBudget, 10000);
    assert.equal(campaign.rewardsIssued, 1200);
    assert.equal(campaign.remainingBudget, 8800);
    assert.equal(campaign.budgetUsagePercent, 12);
  }
  report.budget = { campaignBudget: 10000, rewardsIssued: 1200, remainingBudget: 8800, budgetUsagePercent: 12 };
  pass("Campaign detail, my, and published APIs all report 1200 issued / 8800 remaining / 12%");
  const brandDetail = await request(`/campaigns/${campaignId}`, brandToken);
  assert.deepEqual(brandDetail.campaign.rewardOverview, { approvedCreators: 1, rewardsReady: 0, rewardsCredited: 1, totalVerifiedViews: 6000 });
  pass("Brand performance counters and Creator transaction-derived credited reward match");

  // Separate campaign verifies concurrent credits cannot overspend its budget.
  const raceCampaign = (await request("/campaigns", brandToken, "POST", { title: "Concurrent Reward Budget Regression", description: "Verify transaction isolation under simultaneous reward credits.", requirements: "Original content only.", platform: "INSTAGRAM", contentType: "REEL", campaignBudget: 2000, rewardRatePerThousandViews: 200, minimumPayout: 800, maximumPayoutPerCreator: 1200, creatorSlots: 2, deadline: "2026-12-15T23:59:59.000Z" }, 201)).campaign;
  await request(`/campaigns/${raceCampaign._id}/publish`, brandToken, "PATCH");
  const raceSubmissions = [];
  for (let index = 0; index < 2; index++) {
    const person = await User.create({ name: `Budget Race Creator ${index}`, email: `budget-race-${crypto.randomUUID()}@example.test`, password: crypto.randomBytes(32).toString("hex"), role: "CREATOR", emailVerified: true });
    const token = generateAccessToken(person);
    const application = (await request(`/applications/campaigns/${raceCampaign._id}/apply`, token, "POST", { message: "Budget concurrency regression" }, 201)).application;
    await request(`/applications/${application._id}/review`, brandToken, "PATCH", { decision: "ACCEPTED" });
    const submission = (await request(`/submissions/campaigns/${raceCampaign._id}`, token, "POST", { contentUrl: `https://example.test/budget-race-${index}` }, 201)).submission;
    await request(`/submissions/${submission._id}/review`, brandToken, "PATCH", { decision: "APPROVED" });
    await request(`/submissions/${submission._id}/verify-views`, brandToken, "PATCH", { verifiedViews: 6000 });
    raceSubmissions.push({ id: submission._id, token });
  }
  const raceResults = await Promise.all(raceSubmissions.map(async item => {
    const response = await fetch(`${base}/submissions/${item.id}/credit-reward`, { method: "POST", headers: { Authorization: `Bearer ${brandToken}` } });
    return { status: response.status, body: await response.json() };
  }));
  assert.deepEqual(raceResults.map(item => item.status).sort(), [200, 409]);
  assert.match(raceResults.find(item => item.status === 409).body.message, /Insufficient campaign budget/);
  const exhausted = (await request(`/campaigns/${raceCampaign._id}`, brandToken)).campaign;
  assert.equal(exhausted.rewardsIssued, 1200);
  assert.equal(exhausted.remainingBudget, 800);
  assert.equal(await Transaction.countDocuments({ campaignId: raceCampaign._id, type: "CAMPAIGN_REWARD" }), 1);
  const raceBalances = await Promise.all(raceSubmissions.map(async item => (await request("/wallet/me", item.token)).wallet.availableBalance));
  assert.deepEqual(raceBalances.sort((a, b) => a - b), [0, 1200]);
  report.concurrentBudgetCampaignId = raceCampaign._id;
  pass("Concurrent credits: one succeeds, one rejected for insufficient budget; exactly one credit, no overspend");
  await fs.writeFile(new URL("../../PERFORMANCE_REWARD_CHECKPOINT.json", import.meta.url), JSON.stringify(report, null, 2));
} catch (error) {
  console.error(error.message);
  console.error("Fixture IDs:", JSON.stringify(report));
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
