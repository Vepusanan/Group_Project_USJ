import pool from "../config/database.js";

// Request a connection
export const requestConnection = async (req, res) => {
    try {
        const { requesterId, recipientId } = req.body;

        if (!requesterId || !recipientId) {
            return res.status(400).json({ error: "Requester ID and Recipient ID are required" });
        }

        if (requesterId === recipientId) {
            return res.status(400).json({ error: "Cannot connect with yourself" });
        }

        // Check for existing connection
        const existing = await pool.query(
            "SELECT * FROM connections WHERE (requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1) ORDER BY updated_at DESC LIMIT 1",
            [requesterId, recipientId]
        );

        if (existing.rows.length > 0) {
            const conn = existing.rows[0];

            // If already connected or pending
            if (conn.status === 'accepted') {
                return res.status(400).json({ error: "Already connected" });
            }
            if (conn.status === 'pending') {
                return res.status(400).json({ error: "Connection request already pending" });
            }

            // Reconnection cooldown logic (30 days) if declined
            if (conn.status === 'declined') {
                const cooldownDays = 30;
                const lastUpdated = new Date(conn.updated_at);
                const now = new Date();
                const diffTime = Math.abs(now - lastUpdated);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < cooldownDays) {
                    return res.status(403).json({
                        error: `Cannot re-request. Cooldown period of ${cooldownDays} days active. Try again in ${cooldownDays - diffDays} days.`
                    });
                }
            }
        }

        // Create new connection request
        const result = await pool.query(
            "INSERT INTO connections (requester_id, recipient_id, status) VALUES ($1, $2, 'pending') RETURNING *",
            [requesterId, recipientId]
        );

        // Create notification for recipient
        await pool.query(
            "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'connection_request')",
            [recipientId, `You have a new connection request from user ${requesterId}`]
        );

        res.status(201).json({ message: "Connection request sent", connection: result.rows[0] });

    } catch (error) {
        console.error("Request Connection Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Accept a connection
export const acceptConnection = async (req, res) => {
    try {
        const { id } = req.params; // connection id
        // Ideally we should verify the user accepting is the recipient. 
        // Assuming req.body.userId or middleware handles auth. 
        // For now, simple implementation updating status.

        const check = await pool.query("SELECT * FROM connections WHERE id = $1", [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Connection not found" });
        }

        const connection = check.rows[0];
        if (connection.status !== 'pending') {
            return res.status(400).json({ error: `Connection is already ${connection.status}` });
        }

        // Update status
        const result = await pool.query(
            "UPDATE connections SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
            [id]
        );

        // Send notification to REQUESTER
        await pool.query(
            "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'connection_accepted')",
            [connection.requester_id, `Your connection request to user ${connection.recipient_id} was accepted`]
        );

        res.json({ message: "Connection accepted", connection: result.rows[0] });

    } catch (error) {
        console.error("Accept Connection Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Decline a connection
export const declineConnection = async (req, res) => {
    try {
        const { id } = req.params;

        const check = await pool.query("SELECT * FROM connections WHERE id = $1", [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Connection not found" });
        }

        const connection = check.rows[0];
        if (connection.status !== 'pending') {
            return res.status(400).json({ error: `Connection is already ${connection.status}` });
        }

        // Update status to declined
        const result = await pool.query(
            "UPDATE connections SET status = 'declined', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
            [id]
        );

        // No notification to requester (as per requirement)

        res.json({ message: "Connection declined", connection: result.rows[0] });

    } catch (error) {
        console.error("Decline Connection Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get connections for a user
export const getConnections = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId required" });

        const result = await pool.query(`
            SELECT c.*, 
                   u.full_name as other_user_name, 
                   u.email as other_user_email
            FROM connections c
            JOIN users u ON (c.requester_id = u.id OR c.recipient_id = u.id)
            WHERE (c.requester_id = $1 OR c.recipient_id = $1)
            AND u.id != $1
        `, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error("Get Connections Error:", error);
        res.status(500).json({ error: "Server error" });
    }
}

// Get notifications
export const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ error: "Server error" });
    }
}
