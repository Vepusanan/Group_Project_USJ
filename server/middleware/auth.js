import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const getBearerToken = (req) => {
  // Cookie is the canonical transport for the SPA after the TC-SEC-006
  // migration. The Authorization header fallback keeps curl / Postman
  // workflows working during the transition.
  if (req.cookies?.access_token) return req.cookies.access_token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
};

const getUserFromToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userResult = await pool.query(
    "SELECT id, email, user_type, full_name, email_verified, account_locked_until, created_at FROM users WHERE id = $1",
    [decoded.userId],
  );

  if (userResult.rows.length === 0) {
    const error = new Error("Not authorized, user not found");
    error.statusCode = 401;
    throw error;
  }

  const user = userResult.rows[0];

  if (!user.email_verified) {
    const error = new Error("Access denied. Please verify your email address.");
    error.statusCode = 403;
    throw error;
  }

  if (
    user.account_locked_until &&
    new Date(user.account_locked_until) > new Date()
  ) {
    const error = new Error("Access denied. Account is temporarily locked.");
    error.statusCode = 403;
    error.lockedUntil = user.account_locked_until;
    throw error;
  }

  return user;
};

export const protect = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Not authorized, no token provided." });
  }

  try {
    req.user = await getUserFromToken(token);
    next();
  } catch (error) {
    console.error("JWT Auth Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          error: "Token expired. Please use refresh token to renew.",
        });
    }

    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        error: error.message,
        ...(error.lockedUntil ? { lockedUntil: error.lockedUntil } : {}),
      });
    }

    return res
      .status(401)
      .json({
        success: false,
        error: error.message || "Not authorized, token failed",
      });
  }
};

export const optionalAuth = async (req, res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    return next();
  }

  try {
    req.user = await getUserFromToken(token);
    next();
  } catch (error) {
    // Invalid or expired tokens should not block public browse routes.
    next();
  }
};
