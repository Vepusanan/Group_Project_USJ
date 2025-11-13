import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 1. Fetch user info, INCLUDING verification and lock status
            const userResult = await pool.query(
                "SELECT id, email, user_type, full_name, email_verified, account_locked_until FROM users WHERE id = $1", 
                [decoded.userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
            }

            const user = userResult.rows[0];

            // 2. ENFORCE EMAIL VERIFICATION CHECK
            if (!user.email_verified) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Access denied. Please verify your email address.' 
                });
            }

            // 3. ENFORCE ACCOUNT LOCK CHECK
            if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. Account is temporarily locked.',
                    lockedUntil: user.account_locked_until
                });
            }

            // Attach clean user object to req.user
            req.user = user;
            next();

        } catch (error) {
            console.error("JWT Auth Error:", error.message);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, error: 'Token expired. Please use refresh token to renew.' });
            }
            return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized, no token provided.' });
    }
};