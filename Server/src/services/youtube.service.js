import AppError from "../utils/AppError.js";

const getYouTubeVideoStats = async (videoId) => {
  if (!videoId || typeof videoId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(videoId)) {
    throw new AppError("YouTube video ID is required or invalid", 400);
  }
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith("your_")) {
    throw new AppError("YouTube API key is not configured", 500);
  }
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics,snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  let response;
  let data;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Upstream request failed");
    data = await response.json();
  } catch {
    // Do not log the request URL: it includes the private API key.
    throw new AppError("Unable to fetch YouTube video data", 502);
  }
  const video = data?.items?.[0];
  if (!video) throw new AppError("YouTube video not found", 404);
  const viewCount = Number(video.statistics?.viewCount ?? 0);
  if (!Number.isSafeInteger(viewCount) || viewCount < 0) {
    throw new AppError("Invalid YouTube view count", 502);
  }
  return {
    videoId: video.id,
    title: video.snippet?.title || "",
    channelId: video.snippet?.channelId || null,
    channelTitle: video.snippet?.channelTitle || "",
    viewCount,
  };
};

export { getYouTubeVideoStats };
