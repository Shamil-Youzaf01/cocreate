import crypto from "crypto";
import hashToken from "./hashToken.js";

const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  return {
    token,
    tokenHash,
  };
};

export default generateVerificationToken;
