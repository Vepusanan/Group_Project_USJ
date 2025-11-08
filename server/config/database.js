// Database connection

import pkg from "pg";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const { Pool } = pkg;

// Handle __dirname replacement for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const pool = new Pool({
  user: "postgres.shvlqkqyvccflxtkhyqd",
  host: "aws-1-ap-southeast-2.pooler.supabase.com",
  database: "postgres",
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Handle pool errors (important!)
pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  // Don't crash the app - just log the error
});

// Test connection on startup (properly)
pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected successfully!");
  }
});

export default pool;
