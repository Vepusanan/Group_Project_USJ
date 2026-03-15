import express from "express";
import cors from "cors";
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
import cron from "node-cron";
import { deleteStaleUnverifiedUsers } from "./utils/cleanup.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json()); //body parser
app.use(express.urlencoded({ extended: true }));

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
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      database: "connected",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: error.message,
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/startups/profile", profilesRoutes);
app.use("/api/investors/profile", investorRoutes);
app.use("/api/investors", investorSearchRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/startups", searchRoutes);
// app.use("/api/connections", connectionsRoutes);

// ----------------------------------------------------
// 1. Initialize HTTP Server
// ----------------------------------------------------
const httpServer = createServer(app);

// 2. Initialize Socket.io Server
// Allow connections from any origin (*) during development
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
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
      await deleteStaleUnverifiedUsers();
      console.log("✅ Scheduled cleanup job finished successfully.");
    } catch (error) {
      console.error("❌ Scheduled cleanup job failed.");
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Colombo", // Set the timezone appropriate for your deployment environment
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
