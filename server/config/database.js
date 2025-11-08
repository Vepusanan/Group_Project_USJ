//database connection

const { Pool } = require("pg");
const path = require("path");

require("dotenv").config({
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
pool.on("error", (err, client) => {
  console.error("❌ Unexpected error on idle client", err);
  // Don't crash the app - just log the error
});

// Test connection on startup (properly)
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Database connected successfully!");
  }
});

module.exports = pool;
