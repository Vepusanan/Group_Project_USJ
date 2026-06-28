// Manual / scheduled database backup (NFR 17.4 — Reliability, tasks 4.2/4.3).
//
// Supabase's FREE tier does NOT provide automated backups, so this script
// gives the project a documented, runnable backup procedure that, when
// scheduled daily (cron / GitHub Action — see docs/disaster-recovery.md),
// satisfies "daily backups with 30-day retention".
//
// It shells out to `pg_dump` (must be on PATH — ships with PostgreSQL client
// tools) using the same connection config the app uses, writes a timestamped
// compressed custom-format dump to BACKUP_DIR, then prunes dumps older than
// BACKUP_RETENTION_DAYS (default 30).
//
// Usage:
//   node scripts/backup-database.js
//   BACKUP_DIR=/path/to/backups BACKUP_RETENTION_DAYS=30 node scripts/backup-database.js
//
// Restore (see docs/disaster-recovery.md for the full runbook):
//   pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" <dumpfile>

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 30);
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(__dirname, "..", "backups");

/**
 * Resolve a libpq connection string from env. Prefers DATABASE_URL (the same
 * value the app's pool prefers); otherwise builds one from the Supabase parts.
 */
function resolveConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.DB_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL;
  const projectRef = supabaseUrl?.match(
    /https:\/\/([^.]+)\.supabase\.co/,
  )?.[1];
  const user =
    process.env.DB_USER || (projectRef ? `postgres.${projectRef}` : undefined);
  const host =
    process.env.DB_HOST ||
    (process.env.SUPABASE_DB_REGION
      ? `aws-0-${process.env.SUPABASE_DB_REGION}.pooler.supabase.com`
      : undefined);
  const database = process.env.DB_NAME || "postgres";
  const port = Number(process.env.DB_PORT || 5432);

  if (!user || !host || !password) {
    throw new Error(
      "No DATABASE_URL and incomplete Supabase config. Set DATABASE_URL or SUPABASE_URL + DB_PASSWORD.",
    );
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(
    password,
  )}@${host}:${port}/${database}`;
}

function timestamp() {
  // 2026-06-28T14-30-05 — filesystem-safe ISO.
  return new Date().toISOString().replace(/:/g, "-").replace(/\..+$/, "");
}

function pruneOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return 0;
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let removed = 0;
  for (const name of fs.readdirSync(BACKUP_DIR)) {
    if (!name.startsWith("backup-") || !name.endsWith(".dump")) continue;
    const full = path.join(BACKUP_DIR, name);
    try {
      if (fs.statSync(full).mtimeMs < cutoff) {
        fs.unlinkSync(full);
        removed += 1;
      }
    } catch {
      // ignore individual prune errors
    }
  }
  return removed;
}

function runPgDump(connectionString, outFile) {
  return new Promise((resolve, reject) => {
    // Custom format (-Fc) is compressed and works with pg_restore selective
    // restore. The connection string is passed as the positional dbname arg —
    // libpq interprets a `postgresql://` value as a full connection URI, so the
    // password rides inside the URI rather than a separate flag.
    const args = [
      "-Fc",
      "--no-owner",
      "--no-privileges",
      "-d",
      connectionString,
      "-f",
      outFile,
    ];
    const child = spawn("pg_dump", args, {
      env: {
        ...process.env,
        PGSSLMODE: process.env.PGSSLMODE || "require",
      },
      stdio: ["ignore", "inherit", "inherit"],
    });

    child.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(
            "pg_dump not found on PATH. Install PostgreSQL client tools (e.g. `postgresql-client`).",
          ),
        );
      } else {
        reject(err);
      }
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited with code ${code}`));
    });
  });
}

async function main() {
  const connectionString = resolveConnectionString();
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const outFile = path.join(BACKUP_DIR, `backup-${timestamp()}.dump`);
  console.log(`📦 Backing up database → ${outFile}`);

  await runPgDump(connectionString, outFile);

  const sizeMb = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ Backup complete (${sizeMb} MB).`);

  const removed = pruneOldBackups();
  console.log(
    `🧹 Retention: kept backups newer than ${RETENTION_DAYS} days (pruned ${removed}).`,
  );
}

main().catch((err) => {
  console.error("❌ Backup failed:", err.message);
  process.exit(1);
});
