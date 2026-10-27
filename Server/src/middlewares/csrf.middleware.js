import AppError from "../utils/AppError.js";

// Browser APIs cannot add this header to an ordinary cross-site form. Together
// with an exact Origin check and JSON-only bodies, it prevents cookie-based CSRF.
const requireTrustedAuthRequest = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  let clientOrigin;
  try {
    const clientUrl = new URL(process.env.CLIENT_URL);
    if (!["http:", "https:"].includes(clientUrl.protocol)) throw new Error("Invalid protocol");
    clientOrigin = clientUrl.origin;
  } catch {
    throw new AppError("CLIENT_URL must configure a trusted frontend origin", 500);
  }

  if (req.get("Origin") !== clientOrigin || req.get("X-CoCreate-Request") !== "1") {
    throw new AppError("Authentication requests must come from the trusted application", 403);
  }
  if (!req.is("application/json")) {
    throw new AppError("Authentication requests must use application/json", 415);
  }

  next();
};

export default requireTrustedAuthRequest;
