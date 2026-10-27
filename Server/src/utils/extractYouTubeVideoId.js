const extractYouTubeVideoId = (url) => {
  try {
    if (typeof url !== "string") return null;
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    let videoId = null;
    if (["youtube.com", "www.youtube.com"].includes(parsed.hostname)) {
      if (parsed.pathname === "/watch") videoId = parsed.searchParams.get("v");
      else {
        const match = parsed.pathname.match(/^\/(?:shorts|embed)\/([^/]+)\/?$/);
        videoId = match?.[1];
      }
    } else if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.match(/^\/([^/]+)\/?$/)?.[1];
    }
    return videoId && /^[a-zA-Z0-9_-]+$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
};

export default extractYouTubeVideoId;
