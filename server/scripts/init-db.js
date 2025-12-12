import pool from "../config/database.js";

const createTables = async () => {
  try {
    console.log("🔄 Initializing database tables...");

    // Drop existing tables to ensure clean state
    await pool.query("DROP TABLE IF EXISTS notifications CASCADE");
    await pool.query("DROP TABLE IF EXISTS connections CASCADE");

    // Create Connections table
    await pool.query(`
      CREATE TABLE connections (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER REFERENCES users(id) NOT NULL,
        recipient_id INTEGER REFERENCES users(id) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Connections table ready");

    // Create Notifications table
    await pool.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Notifications table ready");

    // Create index for faster lookups
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_connections_recipient ON connections(recipient_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);

    console.log("🎉 Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
};

createTables();
