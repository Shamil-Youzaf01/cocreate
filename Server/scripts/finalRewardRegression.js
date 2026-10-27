import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Transaction from "../src/models/Transaction.js";
import { generateAccessToken } from "../src/utils/generateTokens.js";

const runId = crypto.randomUUID();
const base = `http://localhost:${process.env.PORT || 5000}/api`;
const report = { runId, checks: [], fixtures: { creators: [] } };
const pass = text => { report.checks.push(text); console.log(`PASS: ${text}`); };
async function request(path, token, method = "GET", body, expected = 200) {
  const response = await fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const json = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${json.message}`);
  return expected >= 400 ? json : json.data;
}
async function user(role, label) {
  const record = await User.create({ name: `Regression ${label}`, email: `${label}-${runId}@example.test`, password: crypto.randomBytes(32).toString("hex"), role, emailVerified: true });
  return { id: String(record._id), token: generateAccessToken(record) };
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 15; attempt++) {
    try { ready = (await fetch(base.replace(/\/api$/, "/"))).status === 200; } catch { /* Wait for development-server restart. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, "Backend must be running");
  await mongoose.connect(process.env.MONGODB_URI);
  const brand = await user("BRAND", "brand");
  report.fixtures.brandId = brand.id;
  const campaign = (await request("/campaigns", brand.token, "POST", { title: `Final Reward Regression ${runId.slice(0, 8)}`, description: "Fresh end-to-end regression for performance-based creator rewards.", requirements: "Original vertical short-form content.", platform: "INSTAGRAM", contentType: "REEL", campaignBudget: 10000, rewardRatePerThousandViews: 200, minimumPayout: 800, maximumPayoutPerCreator: 2500, creatorSlots: 10, deadline: "2026-12-15T23:59:59.000Z" }, 201)).campaign;
  report.fixtures.campaignId = campaign._id;
  const published = await request(`/campaigns/${campaign._id}/publish`, brand.token, "PATCH");
  assert.equal(published.campaign.status, "PUBLISHED");
  pass("Fresh Brand creates and publishes 10000 budget / 200 rate / 800 minimum / 2500 cap campaign");

  async function approvedCreator(label) {
    const creator = await user("CREATOR", label);
    report.fixtures.creators.push({ label, id: creator.id });
    const application = (await request(`/applications/campaigns/${campaign._id}/apply`, creator.token, "POST", { message: "Fresh regression application" }, 201)).application;
    assert.equal(application.status, "PENDING");
    const accepted = await request(`/applications/${application._id}/review`, brand.token, "PATCH", { decision: "ACCEPTED" });
    assert.equal(accepted.application.status, "ACCEPTED");
    const submission = (await request(`/submissions/campaigns/${campaign._id}`, creator.token, "POST", { contentUrl: `https://example.test/${runId}/${label}` }, 201)).submission;
    const approved = await request(`/submissions/${submission._id}/review`, brand.token, "PATCH", { decision: "APPROVED" });
    assert.equal(approved.submission.status, "APPROVED");
    assert.equal(approved.submission.rewardStatus, "PENDING_VERIFICATION");
    const wallet = (await request("/wallet/me", creator.token)).wallet;
    assert.equal(wallet.availableBalance, 0);
    assert.equal(wallet.totalEarned, 0);
    assert.equal(await Transaction.countDocuments({ submissionId: submission._id, type: "CAMPAIGN_REWARD" }), 0);
    return { ...creator, submissionId: submission._id };
  }
  async function verify(creator, views, raw, final, status) {
    const result = (await request(`/submissions/${creator.submissionId}/verify-views`, brand.token, "PATCH", { verifiedViews: views })).submission;
    assert.equal(result.calculatedReward, raw);
    assert.equal(result.finalReward, final);
    assert.equal(result.rewardStatus, status);
    return result;
  }
  async function detail() { return (await request(`/campaigns/${campaign._id}`, brand.token)).campaign; }

  const primary = await approvedCreator("primary");
  pass("Creator applies; Brand accepts; Creator submits; Brand approves; wallet and earned remain 0");
  await verify(primary, 6000, 1200, 1200, "READY");
  pass("6000 views: calculatedReward 1200, finalReward 1200, READY");
  const credited = await request(`/submissions/${primary.submissionId}/credit-reward`, brand.token, "POST");
  assert.equal(credited.wallet.availableBalance, 1200);
  assert.equal(credited.wallet.totalEarned, 1200);
  const transactions = await Transaction.find({ submissionId: primary.submissionId, type: "CAMPAIGN_REWARD" }).lean();
  assert.equal(transactions.length, 1);
  assert.equal(transactions[0].amount, 1200);
  assert.equal(transactions[0].status, "COMPLETED");
  assert.equal(transactions[0].direction, "CREDIT");
  const firstBudget = await detail();
  assert.equal(firstBudget.rewardsIssued, 1200);
  assert.equal(firstBudget.remainingBudget, 8800);
  assert.equal(firstBudget.budgetUsagePercent, 12);
  report.primary = { submissionId: primary.submissionId, availableBalance: 1200, totalEarned: 1200, rewardTransactions: 1, rewardsIssued: 1200, remainingBudget: 8800, budgetUsagePercent: 12 };
  pass("Credit: wallet +1200, earned +1200, exactly one reward transaction; budget 1200 issued / 8800 remaining / 12%");
  await request(`/submissions/${primary.submissionId}/credit-reward`, brand.token, "POST", undefined, 409);
  const walletAfterRetry = (await request("/wallet/me", primary.token)).wallet;
  assert.equal(walletAfterRetry.availableBalance, 1200);
  assert.equal(walletAfterRetry.totalEarned, 1200);
  assert.equal(await Transaction.countDocuments({ submissionId: primary.submissionId, type: "CAMPAIGN_REWARD" }), 1);
  pass("Duplicate credit rejected (409); both wallet totals unchanged; still exactly one reward transaction");

  const low = await approvedCreator("low-views");
  await verify(low, 3000, 600, 0, "NOT_ELIGIBLE");
  await request(`/submissions/${low.submissionId}/credit-reward`, brand.token, "POST", undefined, 409);
  report.lowViews = { calculatedReward: 600, finalReward: 0, rewardStatus: "NOT_ELIGIBLE" };
  pass("3000 views: 600 calculated, 0 eligible, NOT_ELIGIBLE; credit blocked");
  const high = await approvedCreator("high-views");
  await verify(high, 20000, 4000, 2500, "READY");
  report.highViews = { calculatedReward: 4000, finalReward: 2500, rewardStatus: "READY" };
  pass("20000 views: 4000 calculated, capped at 2500, READY");

  // Issue real rewards to leave exactly 1000 available; do not fake ledger rows.
  await request(`/submissions/${high.submissionId}/credit-reward`, brand.token, "POST");
  for (const [label, views, reward] of [["budget-fill-a", 12500, 2500], ["budget-fill-b", 7000, 1400], ["budget-fill-c", 7000, 1400]]) {
    const creator = await approvedCreator(label);
    await verify(creator, views, reward, reward, "READY");
    await request(`/submissions/${creator.submissionId}/credit-reward`, brand.token, "POST");
  }
  const beforeBlocked = await detail();
  assert.equal(beforeBlocked.rewardsIssued, 9000);
  assert.equal(beforeBlocked.remainingBudget, 1000);
  const blocked = await approvedCreator("insufficient-budget");
  await verify(blocked, 6000, 1200, 1200, "READY");
  const rejection = await request(`/submissions/${blocked.submissionId}/credit-reward`, brand.token, "POST", undefined, 409);
  assert.match(rejection.message, /Insufficient campaign budget/);
  const blockedWallet = (await request("/wallet/me", blocked.token)).wallet;
  assert.equal(blockedWallet.availableBalance, 0);
  assert.equal(blockedWallet.totalEarned, 0);
  assert.equal(await Transaction.countDocuments({ submissionId: blocked.submissionId, type: "CAMPAIGN_REWARD" }), 0);
  const blockedSubmission = (await request(`/submissions/${blocked.submissionId}`, blocked.token)).submission;
  assert.equal(blockedSubmission.rewardStatus, "READY");
  const afterBlocked = await detail();
  assert.equal(afterBlocked.rewardsIssued, 9000);
  assert.equal(afterBlocked.remainingBudget, 1000);
  assert.equal(afterBlocked.budgetUsagePercent, 90);
  report.insufficientBudget = { remainingBefore: 1000, requestedReward: 1200, httpStatus: 409, walletBalance: 0, totalEarned: 0, rewardTransactions: 0, rewardsIssuedAfter: 9000, remainingAfter: 1000, rewardStatus: "READY" };
  pass("Exactly 1000 remaining: 1200 credit blocked (409); no wallet or transaction changes; budget remains 9000 issued / 1000 remaining");
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.error = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  await fs.writeFile(new URL("../../FINAL_REWARD_REGRESSION.json", import.meta.url), JSON.stringify(report, null, 2));
  console.log(`Result: ${report.result}. Evidence: FINAL_REWARD_REGRESSION.json. Dedicated fixtures retained.`);
}
