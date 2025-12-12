import pool from '../config/database.js';

// Get accepted connections
export const getConnections = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Logic: Get connections where status is 'accepted' and user is either requester or recipient
        // We need to join with users table to get details of the *other* person
        const query = `
      SELECT 
        c.id as connection_id,
        c.created_at as connected_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.user_type,
        p.profile_picture
      FROM connections c
      JOIN users u ON (
        (c.requester_id = $1 AND c.recipient_id = u.id) OR 
        (c.recipient_id = $1 AND c.requester_id = u.id)
      )
      LEFT JOIN investor_profiles p ON (u.id = p.user_id AND u.user_type = 'investor')
      WHERE (c.requester_id = $1 OR c.recipient_id = $1)
      AND c.status = 'accepted'
      LIMIT $2 OFFSET $3
    `;

        const countQuery = `
      SELECT COUNT(*) 
      FROM connections 
      WHERE (requester_id = $1 OR recipient_id = $1) 
      AND status = 'accepted'
    `;

        const [connectionsResult, countResult] = await Promise.all([
            pool.query(query, [userId, limit, offset]),
            pool.query(countQuery, [userId])
        ]);

        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            connections: connectionsResult.rows,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching connections:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get pending sent requests
export const getPendingSentRequests = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const query = `
      SELECT 
        c.id as connection_id,
        c.created_at as sent_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.user_type
      FROM connections c
      JOIN users u ON c.recipient_id = u.id
      WHERE c.requester_id = $1 AND c.status = 'pending'
      LIMIT $2 OFFSET $3
    `;

        const countQuery = `
      SELECT COUNT(*) 
      FROM connections 
      WHERE requester_id = $1 AND status = 'pending'
    `;

        const [requestsResult, countResult] = await Promise.all([
            pool.query(query, [userId, limit, offset]),
            pool.query(countQuery, [userId])
        ]);

        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            requests: requestsResult.rows,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching sent requests:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get pending received requests
export const getPendingReceivedRequests = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const query = `
      SELECT 
        c.id as connection_id,
        c.created_at as received_at,
        u.id as user_id,
        u.full_name,
        u.email,
        u.user_type
      FROM connections c
      JOIN users u ON c.requester_id = u.id
      WHERE c.recipient_id = $1 AND c.status = 'pending'
      LIMIT $2 OFFSET $3
    `;

        const countQuery = `
      SELECT COUNT(*) 
      FROM connections 
      WHERE recipient_id = $1 AND status = 'pending'
    `;

        const [requestsResult, countResult] = await Promise.all([
            pool.query(query, [userId, limit, offset]),
            pool.query(countQuery, [userId])
        ]);

        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            requests: requestsResult.rows,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching received requests:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Remove connection (delete)
export const removeConnection = async (req, res) => {
    try {
        const userId = req.user.userId;
        const connectionId = req.params.id;

        // Delete if user is requester OR recipient
        const result = await pool.query(
            `DELETE FROM connections 
       WHERE id = $1 AND (requester_id = $2 OR recipient_id = $2)
       RETURNING id`,
            [connectionId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Connection not found or unauthorized'
            });
        }

        res.json({ success: true, message: 'Connection removed' });

    } catch (error) {
        console.error('Error removing connection:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
