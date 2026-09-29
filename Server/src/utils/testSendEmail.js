import dotenv from "dotenv";
dotenv.config();

const { sendVerificationEmail } = await import("../services/email.service.js");

try {
  await sendVerificationEmail({
    email: "creator@example.com",
    name: "Test Creator",
    token: "temporary-test-token",
  });

  console.log("Verification email sent successfully");
} catch (error) {
  console.error("Verification email failed:", error.message);
}

process.exit();
