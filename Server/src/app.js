import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import AppError from "./utils/AppError.js";
import errorHandler from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import reportRoutes from "./routes/report.routes.js";
import disputeRoutes from "./routes/dispute.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Cocreate API is running",
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

app.use(errorHandler);

export default app;
