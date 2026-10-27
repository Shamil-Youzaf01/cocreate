import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import AppError from "../utils/AppError.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => {
    const config = cloudinary.config();
    if ([config.cloud_name, config.api_key, config.api_secret].some(value => !value || value.startsWith("your_"))) {
      throw new AppError("Campaign uploads are not configured. Add Cloudinary credentials to the server environment.", 503);
    }
    return {
      folder: "cocreate/campaigns",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1600, height: 1000, crop: "fill", gravity: "auto", quality: "auto" }],
    };
  },
});

const uploadCampaignCover = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new AppError("Campaign image must be JPG, PNG, or WebP.", 400));
    }
    callback(null, true);
  },
});

export default uploadCampaignCover;
