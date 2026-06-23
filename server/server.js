import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocketServer } from "./socketHandler.js";
import cron from "node-cron";
import { runTrustCleanupJobs } from "./utils/cleanup.js";
import app, { corsWhitelist, isDev } from "./app.js";

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 5001;

const httpServer = createServer(app);

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

initSocketServer(io);

if (!process.env.VERCEL) {
  cron.schedule(
    "0 2 * * *",
    async () => {
      console.log(
        "⏳ Starting scheduled cleanup job (deleting stale unverified accounts)...",
      );
      try {
        await runTrustCleanupJobs();
        console.log("✅ Scheduled cleanup job finished successfully.");
      } catch {
        console.error("❌ Scheduled cleanup job failed.");
      }
    },
    {
      scheduled: true,
      timezone: process.env.CRON_TIMEZONE || "Asia/Colombo",
    },
  );
}

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
  const mode =
    process.env.NODE_ENV === "production" ? "production" : "development";
  console.log(`🚀 Server running on port ${PORT} (${mode})`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});
