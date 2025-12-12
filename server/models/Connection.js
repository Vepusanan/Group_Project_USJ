import pool from '../config/database.js';

export const createConnectionTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS connections (
            id SERIAL PRIMARY KEY,
            requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
            message VARCHAR(300),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_connection UNIQUE (requester_id, recipient_id),
            CONSTRAINT check_self_connection CHECK (requester_id != recipient_id)
        );
    `;
    try {
        await pool.query(query);
        console.log("✅ Connection table created successfully");
    } catch (error) {
        console.error("❌ Error creating connection table:", error.message);
        throw error;
    }
};