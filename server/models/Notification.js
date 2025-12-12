import pool from '../config/database.js';

export const createNotificationTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            message TEXT,
            related_id INTEGER,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(query);
        console.log("✅ Notification table created successfully");
    } catch (error) {
        console.error("❌ Error creating notification table:", error.message);
        throw error;
    }
};
