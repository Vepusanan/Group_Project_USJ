import pool from "../config/database.js";
import bcrypt from "bcryptjs";

async function createTestUsers() {
  console.log("🔍 Creating test users for all 4 developers...\n");

  const testUsers = [
    // Developer 1
    {
      email: "dev1_startup@test.com",
      fullName: "DEV1 Tech Startup",
      userType: "startup",
    },
    {
      email: "dev1_investor@test.com",
      fullName: "DEV1 Ventures",
      userType: "investor",
    },

    // Developer 2
    {
      email: "dev2_startup@test.com",
      fullName: "DEV2 Innovations",
      userType: "startup",
    },
    {
      email: "dev2_investor@test.com",
      fullName: "DEV2 Capital",
      userType: "investor",
    },

    // Developer 3
    {
      email: "dev3_startup@test.com",
      fullName: "DEV3 Solutions",
      userType: "startup",
    },
    {
      email: "dev3_investor@test.com",
      fullName: "DEV3 Investments",
      userType: "investor",
    },

    // Developer 4
    {
      email: "dev4_startup@test.com",
      fullName: "DEV4 Labs",
      userType: "startup",
    },
    {
      email: "dev4_investor@test.com",
      fullName: "DEV4 Partners",
      userType: "investor",
    },
  ];

  try {
    let created = 0;
    let skipped = 0;

    for (const user of testUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash("Test123!", 10);

      // Insert user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, user_type, email_verified) 
         VALUES ($1, $2, $3, $4, true) 
         ON CONFLICT (email) DO NOTHING 
         RETURNING id, email`,
        [user.email, hashedPassword, user.fullName, user.userType]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Created: ${user.email}`);
        created++;
      } else {
        console.log(`⚠️  Already exists: ${user.email}`);
        skipped++;
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Summary:`);
    console.log(`   Created: ${created} users`);
    console.log(`   Skipped: ${skipped} users (already existed)`);
    console.log(`   Password for all: Test123!`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test users:", error.message);
    process.exit(1);
  }
}

createTestUsers();
