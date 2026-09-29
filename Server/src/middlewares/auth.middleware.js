import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired access token", 401);
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError("Account is not active", 403);
  }

  req.user = {
    userId: user._id.toString(),
    role: user.role,
  };

  next();
};

export default protect;
