import { redisClient } from "../config/redis.js";

const VERIFICATION_TTL = 24 * 60 * 60;
const RESEND_COOLDOWN = 60;

const storeVerificationToken = async ({ userId, tokenHash }) => {
  const userKey = `cocreate:email-verification:user:${userId}`;

  const oldTokenHash = await redisClient.get(userKey);

  if (oldTokenHash) {
    const oldTokenKey = `cocreate:email-verification:token:${oldTokenHash}`;

    await redisClient.del(oldTokenKey);
  }

  const tokenKey = `cocreate:email-verification:token:${tokenHash}`;

  await redisClient
    .multi()
    .set(tokenKey, userId, { EX: VERIFICATION_TTL })
    .set(userKey, tokenHash, { EX: VERIFICATION_TTL })
    .exec();
};

const getUserIdByVerificationToken = async (tokenHash) => {
  const tokenKey = `cocreate:email-verification:token:${tokenHash}`;

  return redisClient.get(tokenKey);
};

const deleteVerificationToken = async ({ userId, tokenHash }) => {
  const tokenKey = `cocreate:email-verification:token:${tokenHash}`;

  const userKey = `cocreate:email-verification:user:${userId}`;

  await redisClient.del([tokenKey, userKey]);
};

const getResendCooldown = async (userId) => {
  const cooldownKey = `cocreate:email-verification:cooldown:${userId}`;

  return redisClient.ttl(cooldownKey);
};

const setResendCooldown = async (userId) => {
  const cooldownKey = `cocreate:email-verification:cooldown:${userId}`;

  await redisClient.set(cooldownKey, "1", {
    EX: RESEND_COOLDOWN,
  });
};

export {
  storeVerificationToken,
  getUserIdByVerificationToken,
  deleteVerificationToken,
  getResendCooldown,
  setResendCooldown,
};
