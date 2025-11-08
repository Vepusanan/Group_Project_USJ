import pool from "../config/database.js";

async function testConnection() {
  console.log("🔍 Testing Supabase connection...\n");

  try {
    // Test 1: Basic connection
    const timeResult = await pool.query("SELECT NOW() as current_time");
    console.log("✅ Connection successful!");
    console.log("   Current time:", timeResult.rows[0].current_time);

    // Test 2: Check PostgreSQL version
    const versionResult = await pool.query("SELECT version()");
    console.log(
      "✅ PostgreSQL version:",
      versionResult.rows[0].version.split(" ")[1]
    );

    // Test 3: Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log("✅ Users table exists");

      // Count users
      const countResult = await pool.query("SELECT COUNT(*) FROM users");
      console.log("   Current user count:", countResult.rows[0].count);
    } else {
      console.log("⚠️  Users table not found - please create it in Supabase");
    }

    console.log("\n✅ All tests passed! Database is ready for development.\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    process.exit(1);
  }
}

testConnection();
