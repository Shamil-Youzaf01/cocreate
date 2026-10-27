import { verifySubmissionViews as verifyViews, creditSubmissionReward as creditReward } from "../services/performanceReward.service.js";

export async function verifySubmissionViews(req, res) {
  const submission = await verifyViews({ submissionId: req.params.submissionId, brandId: req.user.userId, verifiedViews: req.body.verifiedViews });
  res.json({ success: true, message: "Views verified successfully.", data: { submission } });
}

export async function creditSubmissionReward(req, res) {
  const data = await creditReward({ submissionId: req.params.submissionId, brandId: req.user.userId });
  res.json({ success: true, message: "Reward credited successfully.", data });
}
