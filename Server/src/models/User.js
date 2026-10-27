import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: "String",
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["CREATOR", "BRAND", "ADMIN"],
      required: [true, "User role is required"],
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    // Shared profile fields
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, "Bio cannot exceed 300 characters"],
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: "",
    },
    instagramUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // Creator-specific profile fields
    youtubeUrl: {
      type: String,
      trim: true,
      default: "",
    },
    categories: {
      type: [String],
      default: [],
    },

    // Brand-specific profile fields
    industry: {
      type: String,
      trim: true,
      maxlength: [100, "Industry cannot exceed 100 characters"],
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
