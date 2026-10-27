import "dotenv/config";
import crypto from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";

const seedUser = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");

  const { name, email, password, role } = {
    name: "Redis Creator",
    email: "rediscreator@test.com",
    password: crypto.randomBytes(32).toString("hex"),
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

  console.log(`Account is unverified. Use ${process.env.CLIENT_URL}/register to request a signup link and choose a password.`);
  await mongoose.disconnect();
  console.log("Disconnected");
  process.exit(0);
};

seedUser().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
