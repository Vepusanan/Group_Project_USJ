// Database connection

import pkg from "pg";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

function buildPoolConfig() {
  const sharedOptions = {
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    ssl: {
      rejectUnauthorized: false,
    },
  };

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ...sharedOptions,
    };
  }

  const password = process.env.DB_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  const user = process.env.DB_USER || (projectRef ? `postgres.${projectRef}` : undefined);
  const host =
    process.env.DB_HOST ||
    (process.env.SUPABASE_DB_REGION
      ? `aws-0-${process.env.SUPABASE_DB_REGION}.pooler.supabase.com`
      : undefined);
  const database = process.env.DB_NAME || "postgres";
  const port = Number(process.env.DB_PORT || 5432);

  if (!user || !host || !password) {
    throw new Error(
      "Database config missing. Set DATABASE_URL or SUPABASE_URL + DB_PASSWORD (and optionally DB_HOST).",
    );
  }

  return {
    user,
    host,
    database,
    password,
    port,
    ...sharedOptions,
  };
}

const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
});

pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    if (err.message.includes("ENOTFOUND") || err.message.includes("tenant/user")) {
      console.error(
        "   Check server/.env: the Supabase project may be paused, deleted, or the connection string is outdated.",
      );
      console.error(
        "   Get a fresh connection string from Supabase → Project Settings → Database → Session pooler.",
      );
    }
  } else {
    console.log("✅ Database connected successfully!");
  }
});

export default pool;