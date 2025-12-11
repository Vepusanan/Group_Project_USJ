import pool from '../config/database.js';

// Send a connection request
export const sendRequest = async (req, res) => {
    try {
        const investorId = req.user.userId;
        const { startupId } = req.body;

        if (req.user.userType !== 'investor') {
            return res.status(403).json({ success: false, error: 'Only investors can send connection requests' });
        }

        // Check if connection already exists
        const checkQuery = 'SELECT * FROM connections WHERE investor_id = $1 AND startup_id = $2';
        const checkResult = await pool.query(checkQuery, [investorId, startupId]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Connection request already exists' });
        }

        // Create new connection
        const insertQuery = `
      INSERT INTO connections (investor_id, startup_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `;
        const result = await pool.query(insertQuery, [investorId, startupId]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error sending connection request:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Update connection status (Accept/Reject)
export const updateStatus = async (req, res) => {
    try {
        const userId = req.user.userId; // Startup ID
        const { connectionId, status } = req.body;

        if (req.user.userType !== 'startup') {
            return res.status(403).json({ success: false, error: 'Only startups can respond to requests' });
        }

        if (!['connected', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        // Verify the connection belongs to this startup
        const checkQuery = 'SELECT * FROM connections WHERE id = $1 AND startup_id = $2';
        const checkResult = await pool.query(checkQuery, [connectionId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Connection request not found' });
        }

        // Update status
        const updateQuery = `
      UPDATE connections 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
        const result = await pool.query(updateQuery, [status, connectionId]);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating connection status:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get list of connections
export const getConnections = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userType = req.user.userType;

        let query = '';

        if (userType === 'investor') {
            // Investors see Startups they connected with
            query = `
            SELECT 
                c.id as connection_id,
                c.status,
                c.created_at as request_date,
                u.id as user_id,
                u.full_name,
                u.email,
                p.tagline
            FROM connections c
            JOIN users u ON u.id = c.startup_id
            LEFT JOIN startup_profiles p ON p.user_id = u.id
            WHERE c.investor_id = $1
            ORDER BY c.created_at DESC
        `;
        } else {
            // Startups see Investors who connected with them
            query = `
            SELECT 
                c.id as connection_id,
                c.status,
                c.created_at as request_date,
                u.id as user_id,
                u.full_name,
                u.email
            FROM connections c
            JOIN users u ON u.id = c.investor_id
            WHERE c.startup_id = $1
            ORDER BY c.created_at DESC
        `;
        }

        const result = await pool.query(query, [userId]);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
