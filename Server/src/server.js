import "dotenv/config";
import mongoose from "mongoose";

import app from "./app.js";
import connectDatabase from "./config/database.js";
import { connectRedis, redisClient } from "./config/redis.js";
import validateEnv from "./config/env.js";

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    validateEnv();

    await connectDatabase();
    await connectRedis();

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);

    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (!server) {
    process.exit(0);
  }

  server.close(async () => {
    try {
      await mongoose.connection.close();

      if (redisClient.isOpen) {
        await redisClient.quit();
      }

      console.log("Database connections closed");

      process.exit(0);
    } catch (error) {
      console.error("Graceful shutdown failed:", error.message);

      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

startServer();
