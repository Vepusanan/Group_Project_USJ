import pool from '../config/database.js';
import { sendEmail } from '../config/email.js';

export const sendConnectionRequest = async (req, res) => {
    const requesterId = req.user.id;
    const { recipientId, message } = req.body;

    if (!recipientId) {
        return res.status(400).json({ error: "Recipient ID is required" });
    }

    if (requesterId === parseInt(recipientId)) {
        return res.status(400).json({ error: "Cannot connect with yourself" });
    }

    try {
        // 1. Validate User Types
        const usersRes = await pool.query(
            "SELECT id, user_type, full_name, email FROM users WHERE id IN ($1, $2)",
            [requesterId, recipientId]
        );

        const users = usersRes.rows;
        if (users.length !== 2) {
            return res.status(404).json({ error: "One or both users not found" });
        }

        const requester = users.find(u => u.id === requesterId);
        const recipient = users.find(u => u.id === parseInt(recipientId));

        if (requester.user_type === recipient.user_type) {
            return res.status(400).json({ error: `Connection allowed only between Startup and Investor. Both are ${requester.user_type}.` });
        }

        const validTypes = ['startup', 'investor'];
        if (!validTypes.includes(requester.user_type) || !validTypes.includes(recipient.user_type)) {
            return res.status(400).json({ error: "Invalid user types for connection" });
        }


        // 2. Check Existing Connection (Any direction)
        const existingCheck = await pool.query(
            `SELECT * FROM connections 
       WHERE (requester_id = $1 AND recipient_id = $2) 
          OR (requester_id = $2 AND recipient_id = $1)`,
            [requesterId, recipientId]
        );

        if (existingCheck.rows.length > 0) {
            const conn = existingCheck.rows[0];
            return res.status(400).json({ error: `Connection already exists (Status: ${conn.status})` });
        }

        // 3. Create Connection
        const msg = message || `Hi, I'm ${requester.full_name}, I'd like to connect.`;
        const newConn = await pool.query(
            `INSERT INTO connections (requester_id, recipient_id, status, message) 
       VALUES ($1, $2, 'pending', $3) RETURNING *`,
            [requesterId, recipientId, msg]
        );

        // 4. Notifications
        // In-App
        await pool.query(
            `INSERT INTO notifications (user_id, type, message, related_id) 
       VALUES ($1, 'connection_request', $2, $3)`,
            [recipientId, `New connection request from ${requester.full_name}`, newConn.rows[0].id]
        );

        // Email
        const emailSubject = `New Connection Request from ${requester.full_name}`;
        const emailBody = `Hello ${recipient.full_name},\n\n${requester.full_name} (${requester.user_type}) wants to connect with you.\n\nMessage: "${msg}"\n\nLog in to accept or decline.`;

        // We don't await email to avoid blocking response, or we can await if critical. 
        // Usually better to fire and forget or use queue. For now, await is safer for "task complete" feeling unless it's slow.
        // Given dev fallback is fast, await is fine.
        await sendEmail(recipient.email, emailSubject, emailBody);

        res.status(201).json({
            message: "Connection request sent",
            connection: newConn.rows[0]
        });

    } catch (error) {
        console.error("Connection Request Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getConnectionStatus = async (req, res) => {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    try {
        const result = await pool.query(
            `SELECT * FROM connections 
       WHERE (requester_id = $1 AND recipient_id = $2) 
          OR (requester_id = $2 AND recipient_id = $1)`,
            [currentUserId, targetUserId]
        );

        if (result.rows.length === 0) {
            return res.json({ status: 'none', connection: null });
        }

        const conn = result.rows[0];
        // Normalize status relative to current user if needed, but 'pending'/'accepted' is standard.
        // pending means requester is waiting.
        res.json({ status: conn.status, connection: conn });

    } catch (error) {
        console.error("Get Status Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
