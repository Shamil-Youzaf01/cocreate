import extractYouTubeVideoId from "../utils/extractYouTubeVideoId.js";
import { getYouTubeVideoStats } from "../services/youtube.service.js";
import AppError from "../utils/AppError.js";

const testYouTubeVideo = async (req, res, next) => {
  try {
    const url = req.body?.url;
    if (!url) throw new AppError("YouTube URL is required", 400);
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) throw new AppError("Invalid YouTube URL", 400);
    const stats = await getYouTubeVideoStats(videoId);
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export { testYouTubeVideo };
