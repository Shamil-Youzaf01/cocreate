import crypto from "crypto";
import { redisClient } from "../config/redis.js";

const SESSION_TTL = Number(process.env.SESSION_TTL_SECONDS);

const createSession = async (userId) => {
  const sessionId = crypto.randomUUID();

  const sessionKey = `cocreate:session:${sessionId}`;

  const sessionData = {
    userId: userId.toString(),
  };

  await redisClient.set(sessionKey, JSON.stringify(sessionData), {
    EX: SESSION_TTL,
  });

  return sessionId;
};

const getSession = async (sessionId) => {
  const sessionKey = `cocreate:session:${sessionId}`;

  const session = await redisClient.get(sessionKey);

  if (!session) {
    return null;
  }

  return JSON.parse(session);
};

const deleteSession = async (sessionId) => {
  const sessionKey = `cocreate:session:${sessionId}`;

  await redisClient.del(sessionKey);
};

const deleteUserSessions = async (userId) => {
  let cursor = "0";

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: "cocreate:session:*",
      COUNT: 100,
    });

    cursor = result.cursor;

    for (const key of result.keys) {
      const sessionData = await redisClient.get(key);

      if (!sessionData) continue;

      const session = JSON.parse(sessionData);

      if (session.userId === userId.toString()) {
        await redisClient.del(key);
      }
    }
  } while (cursor !== "0");
};

export { createSession, getSession, deleteSession, deleteUserSessions };
