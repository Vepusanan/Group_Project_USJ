import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import pool from "./config/database.js";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/account.js";
import profilesRoutes from "./routes/profiles.js";
import investorRoutes from "./routes/investors.js";
import messagesRoutes from "./routes/messages.js";
import searchRoutes from "./routes/search.js";
import investorSearchRoutes from "./routes/investorSearch.js";
import uploadsRoutes from "./routes/uploads.js";
import settingsRoutes from "./routes/settings.js";
import connectionsRoutes from "./routes/connections.js";
import notificationsRoutes from "./routes/notifications.js";
import pitchDecksRoutes from "./routes/pitchDecks.js";
import dataRoomsRoutes from "./routes/dataRooms.js";
import fundingRoundsRoutes from "./routes/fundingRounds.js";
import dealPipelineRoutes from "./routes/dealPipeline.js";
import investorIntentsRoutes from "./routes/investorIntents.js";
import startupAnalyticsRoutes from "./routes/startupAnalytics.js";
import verificationRoutes from "./routes/verification.js";
import adminRoutes from "./routes/admin.js";
import watchlistRoutes from "./routes/watchlist.js";
import milestonesRoutes from "./routes/milestones.js";
import meetingsRoutes from "./routes/meetings.js";
import ddChecklistsRoutes from "./routes/ddChecklists.js";
import comparisonsRoutes from "./routes/comparisons.js";
import connectionQaRoutes from "./routes/connectionQa.js";
import profileReportsRoutes from "./routes/profileReports.js";
import realtimeRoutes from "./routes/realtime.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { requestTiming } from "./middleware/requestTiming.js";
import { hasEmailCredentials } from "./utils/emailTransport.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config({ quiet: true });

const corsOriginEnv = process.env.FRONTEND_URL;
export const corsWhitelist = corsOriginEnv
  ? corsOriginEnv.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

export const isDev = process.env.NODE_ENV !== "production";
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function createApp() {
  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (corsWhitelist.includes(origin)) return callback(null, true);
        if (isDev && localhostRegex.test(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestTiming);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  if (process.env.NODE_ENV === "development") {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  app.get("/api/health", async (req, res) => {
    const checks = {
      database: process.env.DATABASE_URL
        ? "configured"
        : process.env.SUPABASE_URL && process.env.DB_PASSWORD
          ? "configured"
          : "not_configured",
      email: hasEmailCredentials() ? "configured" : "not_configured",
      gemini: process.env.GEMINI_API_KEY ? "configured" : "not_configured",
      storage: process.env.SUPABASE_URL ? "configured" : "not_configured",
      jwt: process.env.JWT_SECRET ? "configured" : "not_configured",
    };

    if (checks.database === "not_configured") {
      return res.status(503).json({
        status: "error",
        checks,
        error:
          "DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.",
      });
    }

    try {
      const result = await pool.query("SELECT NOW()");
      checks.database = "connected";
      res.json({
        status: "ok",
        checks,
        timestamp: result.rows[0].now,
      });
    } catch (error) {
      checks.database = "disconnected";
      res.status(500).json({
        status: "error",
        checks,
        error: error.message,
      });
    }
  });

  app.use("/api", generalLimiter);

  app.use("/api/auth", authRoutes);
  app.use("/api/account", accountRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/startups/profile", profilesRoutes);
  app.use("/api/investors/profile", investorRoutes);
  app.use("/api/investors", investorSearchRoutes);
  app.use("/api/uploads", uploadsRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/realtime", realtimeRoutes);
  app.use("/startups", searchRoutes);
  app.use("/api/startups", searchRoutes);
  app.use("/api/connections", connectionsRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/pitch-decks", pitchDecksRoutes);
  app.use("/api/data-rooms", dataRoomsRoutes);
  app.use("/api/funding-rounds", fundingRoundsRoutes);
  app.use("/api/deal-pipeline", dealPipelineRoutes);
  app.use("/api/investor-intents", investorIntentsRoutes);
  app.use("/api/startup-analytics", startupAnalyticsRoutes);
  app.use("/api/verification", verificationRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/watchlist", watchlistRoutes);
  app.use("/api/milestones", milestonesRoutes);
  app.use("/api/meetings", meetingsRoutes);
  app.use("/api/dd-checklists", ddChecklistsRoutes);
  app.use("/api/comparisons", comparisonsRoutes);
  app.use("/api/connection-qa", connectionQaRoutes);
  app.use("/api/profile-reports", profileReportsRoutes);

  const clientDist = path.join(__dirname, "../client/dist");
  const serveFrontend =
    !process.env.VERCEL &&
    process.env.SERVE_FRONTEND !== "false" &&
    fs.existsSync(path.join(clientDist, "index.html"));

  if (serveFrontend) {
    app.use(express.static(clientDist, { index: false, maxAge: "1d" }));

    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }
      if (req.path.startsWith("/api") || req.path.startsWith("/startups")) {
        return next();
      }
      res.sendFile(path.join(clientDist, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  app.use((req, res) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/startups")) {
      res.status(404).json({ error: "Route not found" });
      return;
    }
    res.status(404).json({ error: "Route not found" });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: "Something went wrong!",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  });

  return app;
}

const app = createApp();
export default app;
