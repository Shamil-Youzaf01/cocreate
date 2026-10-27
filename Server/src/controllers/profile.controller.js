import serializeUser from "../utils/serializeUser.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

export const updateMyProfile = async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) throw new AppError("User not found", 404);

  const allowedFields = [
    "name", "bio", "location", "avatarUrl", "instagramUrl",
    ...(user.role === "CREATOR" ? ["youtubeUrl", "categories"] : []),
    ...(user.role === "BRAND" ? ["industry", "website"] : []),
  ];
  const body = req.validated.body;
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) user[field] = body[field];
  }
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: serializeUser(user),
    },
  });
};
