import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocketServer } from "./socketHandler.js";
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
import cron from "node-cron";
import { runTrustCleanupJobs } from "./utils/cleanup.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { requestTiming } from "./middleware/requestTiming.js";
import { hasEmailCredentials } from "./utils/emailTransport.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 5001;

// CORS — cookies require an exact origin + credentials:true.
// Production: require explicit whitelist via FRONTEND_URL (comma-separated).
// Development: also accept any http://localhost:<port> or http://127.0.0.1:<port>
// because Vite floats the port when the default is taken.
const corsOriginEnv = process.env.FRONTEND_URL;
const corsWhitelist = corsOriginEnv
  ? corsOriginEnv.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const isDev = process.env.NODE_ENV !== "production";
const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // No-Origin requests are server-to-server / curl — allow.
      if (!origin) return callback(null, true);
      if (corsWhitelist.includes(origin)) return callback(null, true);
      if (isDev && localhostRegex.test(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json()); //body parser
app.use(express.urlencoded({ extended: true }));
app.use(requestTiming);

// Expose uploads for local testing (POSTMAN). In production use S3 or equivalent.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logging (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get("/api/health", async (req, res) => {
  const checks = {
    database: "unknown",
    email: hasEmailCredentials() ? "configured" : "not_configured",
    gemini: process.env.GEMINI_API_KEY ? "configured" : "not_configured",
    storage: process.env.SUPABASE_URL ? "configured" : "not_configured",
  };

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/startups/profile", profilesRoutes);
app.use("/api/investors/profile", investorRoutes);
app.use("/api/investors", investorSearchRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/messages", messagesRoutes);
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

// ----------------------------------------------------
// 1. Initialize HTTP Server
// ----------------------------------------------------
const httpServer = createServer(app);

// 2. Initialize Socket.io Server
// Allow connections from any origin (*) during development
const socketCorsOrigins = corsWhitelist.length
  ? corsWhitelist
  : isDev
    ? [/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/]
    : [];

const io = new Server(httpServer, {
  cors: {
    origin: socketCorsOrigins.length ? socketCorsOrigins : true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 3. Inject Socket.io server into the socket handler
initSocketServer(io);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Schedule the cleanup job to run every day at 2:00 AM (0 2 * * *)
cron.schedule(
  "0 2 * * *",
  async () => {
    console.log(
      "⏳ Starting scheduled cleanup job (deleting stale unverified accounts)...",
    );
    try {
      await runTrustCleanupJobs();
      console.log("✅ Scheduled cleanup job finished successfully.");
    } catch (error) {
      console.error("❌ Scheduled cleanup job failed.");
    }
  },
  {
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE || "Asia/Colombo",
  },
);

// Start the server using the HTTP server instance for Socket.io integration
httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(
      "Stop the existing server process or run with a different PORT (example: PORT=5001).",
    );
    process.exit(1);
  }

  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
