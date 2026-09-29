import { config } from "dotenv";
config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import { redisClient } from "../src/config/redis.js";
import { storeVerificationToken } from "../src/services/emailVerification.service.js";
import generateVerificationToken from "../src/utils/generateVerificationToken.js";

const seedUser = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");

  await redisClient.connect();
  console.log("Redis connected");

  const { name, email, password, role } = {
    name: "Redis Creator",
    email: "rediscreator@test.com",
    password: "password123",
    role: "CREATOR",
  };

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    console.log(`User ${email} already exists, skipping creation`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
  });

  console.log(`User created: ${user.email}`);

  const { token, tokenHash } = generateVerificationToken();
  await storeVerificationToken({
    userId: user._id.toString(),
    tokenHash,
  });

  console.log(`Verification token generated`);
  console.log(
    `Verification URL: ${process.env.CLIENT_URL}/verify-email?token=${token}`,
  );

  await redisClient.disconnect();
  await mongoose.disconnect();
  console.log("Disconnected");
  process.exit(0);
};

seedUser().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
