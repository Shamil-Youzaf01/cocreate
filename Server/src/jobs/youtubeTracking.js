import Submission from "../models/Submission.js";
import { syncYouTubeSubmission } from "../services/youtubeTracking.service.js";

export async function runYouTubeTrackingBatch(stopped = () => false) {
  const submissions = await Submission.find({ status: "APPROVED", rewardStatus: { $ne: "CREDITED" },
    "platformTracking.source": "YOUTUBE_API", $or: [
      { "platformTracking.lastSyncedAt": { $lte: new Date(Date.now() - 15 * 60 * 1000) } },
      { "platformTracking.lastSyncedAt": null },
    ] }).sort({ updatedAt: 1 }).limit(50).select("_id").lean();
  for (const submission of submissions) {
    if (stopped()) break;
    try { await syncYouTubeSubmission({ submissionId: submission._id }); }
    catch (error) { console.error(`YouTube sync ${submission._id}: ${error.message}`); }
  }
}

// Sequential bounded batches keep API use predictable. Failed videos retry next cycle.
export function startYouTubeTracking() {
  const intervalMs = 15 * 60 * 1000;
  let running = false;
  let stopped = false;
  async function tick() {
    if (running || stopped || !process.env.YOUTUBE_API_KEY) return;
    running = true;
    try {
      await runYouTubeTrackingBatch(() => stopped);
    } catch (error) { console.error("YouTube sync batch failed:", error.message); }
    finally { running = false; }
  }
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  void tick();
  return () => { stopped = true; clearInterval(timer); };
}
