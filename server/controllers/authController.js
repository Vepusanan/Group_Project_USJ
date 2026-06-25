import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import {
  lockAccountIfNecessary,
  logFailedLoginAttempt,
} from "../utils/loginSecurity.js";
import crypto from "crypto";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmationEmail,
} from "../utils/emailServices.js";
import { getFrontendBaseUrl } from "../utils/appUrls.js";
import { resolvePostAuthRedirectPath } from "../utils/authRedirects.js";
import { UAParser } from "ua-parser-js";
import { tryAwardIdentityVerification } from "../services/identityVerificationService.js";
import {
  getClientIp,
  logAuthEvent,
  touchUserActivity,
} from "../repositories/UserActivityRepository.js";
import { isAdminUser } from "../middleware/admin.js";

//auth business logic

// Helper function to generate a secure refresh token
const generateRefreshToken = () => {
  // Generate a long, cryptographically secure random string
  return crypto.randomBytes(64).toString("hex");
};

// Function to generate a new short-lived access token (15m)
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, userType: user.user_type },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }, // Standard short-lived access token
  );
};

// Cookie attributes shared by every auth-related response. HttpOnly so JS
// in the SPA can't read the token (TC-SEC-006); SameSite=strict so the
// cookie isn't sent on cross-site requests (CSRF defence); Path=/ so it
// covers every API route. `secure` is on in production only — Chrome
// allows non-secure cookies on localhost during dev.
const cookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.AUTH_COOKIE_SAME_SITE || "strict",
  path: "/",
});

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const SHORT_REFRESH_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const LONG_REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const setAuthCookies = (res, { accessToken, refreshToken, isRemembered }) => {
  res.cookie("access_token", accessToken, {
    ...cookieBase(),
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  if (refreshToken) {
    res.cookie("refresh_token", refreshToken, {
      ...cookieBase(),
      maxAge: isRemembered
        ? LONG_REFRESH_MAX_AGE_MS
        : SHORT_REFRESH_MAX_AGE_MS,
    });
  }
};

const clearAuthCookies = (res) => {
  // clearCookie must use matching attrs (path/sameSite/secure) for the
  // browser to actually delete the cookie.
  res.clearCookie("access_token", { ...cookieBase() });
  res.clearCookie("refresh_token", { ...cookieBase() });
};

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, fullName, userType, agreedToTerms } = req.body;

    if (!email || !password || !fullName || !userType) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    if (!agreedToTerms) {
      return res.status(400).json({
        success: false,
        error: "You must accept the terms and conditions",
      });
    }

    if (!["startup", "investor"].includes(userType)) {
      return res.status(400).json({
        success: false,
        error: "User type must be startup or investor",
      });
    } // Check if user exists

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    } // Hash password

    const hashedPassword = await bcrypt.hash(password, 10); // 1. Generate verification token (JWT valid for 24 hours)

    const verificationToken = jwt.sign(
      { email: email.toLowerCase() },
      process.env.JWT_VERIFY_SECRET, // Use a separate secret for verification
      { expiresIn: "1h" },
    );

    const tokenExpiration = new Date(Date.now() + 60 * 60 * 1000);
    const termsVersion = process.env.TERMS_VERSION || "2026-06";

    const result = await pool.query(
      `INSERT INTO users (
     email, 
     password_hash, 
     full_name, 
     user_type, 
     email_verified, 
     email_verification_token, 
     email_verification_token_expires,
     terms_accepted_at,
     terms_version
   )
   VALUES ($1, $2, $3, $4, false, $5, $6, NOW(), $7)
   RETURNING id, email, full_name, user_type, created_at, email_verification_token, email_verification_token_expires`,
      [
        email.toLowerCase(),
        hashedPassword,
        fullName,
        userType,
        verificationToken,
        tokenExpiration,
        termsVersion,
      ],
    );

    const user = result.rows[0]; // 3. Send verification email

    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.", // <-- Updated message
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during registration",
    });
  }
};

const serializeAuthUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  userType: user.user_type,
  emailVerified: user.email_verified,
  createdAt: user.created_at,
  isAdmin: isAdminUser(user),
});

const resolvePostVerificationPath = (user) => resolvePostAuthRedirectPath(user);

const createVerifiedUserSession = async (user, req, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + LONG_REFRESH_MAX_AGE_MS);

  let deviceInfo = "Email verification";
  const userAgent = req.headers["user-agent"];
  if (userAgent) {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    deviceInfo = `${browser.name || "Unknown Browser"} on ${
      os.name || "Unknown OS"
    } ${os.version || ""}`.trim();
  }

  await pool.query(
    `INSERT INTO sessions (user_id, refresh_token, is_remembered, expires_at, client_ip, device_info)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      user.id,
      refreshToken,
      true,
      expiresAt,
      req.ip || req.connection?.remoteAddress || null,
      deviceInfo,
    ],
  );

  setAuthCookies(res, {
    accessToken,
    refreshToken,
    isRemembered: true,
  });

  await touchUserActivity(user.id);
  await logAuthEvent({
    userId: user.id,
    eventType: "session_created",
    clientIp: getClientIp(req),
  });

  return {
    user: serializeAuthUser(user),
    sessionExpires: expiresAt.toISOString(),
    redirectPath: await resolvePostVerificationPath(user),
  };
};

// Verify email address
export const verifyEmail = async (req, res) => {
  const loginUrl = `${getFrontendBaseUrl()}/login`;
  const wantsJson = req.query.format === "json";

  const fail = (reason, status = 400, message) => {
    if (wantsJson) {
      return res.status(status).json({
        success: false,
        error: message || "Email verification failed",
        reason,
      });
    }
    return res.redirect(`${loginUrl}?verified=failed&reason=${reason}`);
  };

  try {
    const { token } = req.query;

    if (!token) {
      return fail("missing_token");
    }

    const decoded = jwt.verify(token, process.env.JWT_VERIFY_SECRET);
    const userEmail = decoded.email;

    const result = await pool.query(
      `SELECT * FROM users
       WHERE email = $1
         AND email_verification_token = $2
         AND email_verification_token_expires > NOW()`,
      [userEmail, token],
    );

    if (result.rows.length === 0) {
      return fail("invalid_or_expired");
    }

    const userId = result.rows[0].id;

    await pool.query(
      `UPDATE users
       SET email_verified = true,
           email_verification_token = NULL,
           email_verification_token_expires = NULL
       WHERE id = $1`,
      [userId],
    );

    const freshUserResult = await pool.query(
      `SELECT id, email, full_name, user_type, email_verified, created_at
       FROM users WHERE id = $1`,
      [userId],
    );
    const user = freshUserResult.rows[0];
    await logAuthEvent({
      userId: user.id,
      eventType: "email_verified",
      clientIp: getClientIp(req),
    });
    tryAwardIdentityVerification(userId).catch(() => undefined);
    const session = await createVerifiedUserSession(user, req, res);

    console.info("[auth] email_verified", {
      userId: user.id,
      userType: user.user_type,
      redirectPath: session.redirectPath,
      format: wantsJson ? "json" : "redirect",
      clientIp: getClientIp(req),
    });

    if (wantsJson) {
      return res.json({
        success: true,
        message: "Email verified successfully",
        user: session.user,
        redirectPath: session.redirectPath,
        sessionExpires: session.sessionExpires,
      });
    }

    return res.redirect(
      `${getFrontendBaseUrl()}${session.redirectPath}?verified=success`,
    );
  } catch (error) {
    console.error("Email verification error:", error);
    if (error.name === "TokenExpiredError") {
      return fail("expired");
    }
    if (error.name === "JsonWebTokenError") {
      return fail("invalid_token");
    }
    return fail("server_error", 500);
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body; // 1. Check if email is provided

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required.",
      });
    } // 2. Check if user exists

    const result = await pool.query(
      "SELECT id, email_verified FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      // Return a non-specific success message to avoid user enumeration attacks
      return res.status(200).json({
        success: true,
        message:
          "If the email address is associated with an unverified account, a new verification link has been sent.",
      });
    }

    const user = result.rows[0]; // 3. Check if user is already verified

    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: "This account is already verified.",
      });
    } // 4. Generate new token

    const newVerificationToken = jwt.sign(
      { email: email.toLowerCase() },
      process.env.JWT_VERIFY_SECRET,
      { expiresIn: "1h" }, // Reset expiration to 1 hour from now
    );

    const tokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // 5. Update user with new token and expiration

    await pool.query(
      `UPDATE users
 SET email_verification_token = $1,
     email_verification_token_expires = $2
 WHERE id = $3`,
      [newVerificationToken, tokenExpiration, user.id],
    ); // 6. Send new verification email

    await sendVerificationEmail(email.toLowerCase(), newVerificationToken);

    res.status(200).json({
      success: true,
      message: "A new verification link has been sent to your email address.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while processing request.",
    });
  }
};

// User Login
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body; // Capture rememberMe

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Capture request metadata up-front so it's available for every audit-log
    // path below (unknown-user, wrong-password, lockout).
    const clientIp = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;

    const result = await pool.query(
      "SELECT id, email, password_hash, email_verified, full_name, user_type, failed_login_attempts, account_locked_until, created_at, deleted_at FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      // Log the attempt with userId=null so the audit trail still captures the
      // IP and the email that was tried, even if no account exists.
      logFailedLoginAttempt({
        userId: null,
        email: email.toLowerCase(),
        clientIp,
        userAgent,
      });
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    if (
      user.account_locked_until &&
      new Date(user.account_locked_until) > new Date()
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Account is locked due to too many failed login attempts. Try again later.",
        lockedUntil: user.account_locked_until,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Audit log (TC-SEC-004) — every failed attempt gets an IP-stamped row.
      logFailedLoginAttempt({
        userId: user.id,
        email: user.email,
        clientIp,
        userAgent,
      });

      const failedResult = await lockAccountIfNecessary(
        user.id,
        user.failed_login_attempts,
        user.email,
        { clientIp, fullName: user.full_name },
      );
      if (failedResult.locked) {
        return res.status(403).json({
          success: false,
          error: "Too many failed login attempts. Account locked for 1 hour.",
          lockedUntil: failedResult.lockUntil.toISOString(),
        });
      }
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    } // --- START SUCCESS PATH ---

    if (user.failed_login_attempts > 0) {
      await pool.query(
        "UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = $1",
        [user.id],
      );
    }

    if (user.deleted_at) {
      await pool.query(
        `UPDATE users SET deleted_at = NULL, deletion_scheduled_at = NULL WHERE id = $1`,
        [user.id],
      );
    }

    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        error:
          "Account is not verified. Please check your email for the verification link.",
        emailVerified: false,
      });
    }

    const accessToken = generateAccessToken(user);

    const refreshToken = generateRefreshToken();
    const isRemembered = !!rememberMe;

    const sessionDuration = isRemembered
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    const expiresAt = new Date(Date.now() + sessionDuration);

    let deviceInfo = "Unknown Device/Browser";
    if (userAgent) {
      const parser = new UAParser(userAgent);
      const browser = parser.getBrowser();
      const os = parser.getOS();
      deviceInfo = `${browser.name || "Unknown Browser"} on ${
        os.name || "Unknown OS"
      } ${os.version || ""}`.trim();
    }
    await pool.query(
      `INSERT INTO sessions (user_id, refresh_token, is_remembered, expires_at, client_ip, device_info) VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, refreshToken, isRemembered, expiresAt, clientIp, deviceInfo],
    );
    setAuthCookies(res, { accessToken, refreshToken, isRemembered });
    await touchUserActivity(user.id);
    await logAuthEvent({
      userId: user.id,
      eventType: "login_success",
      clientIp,
    });
    const redirectPath = await resolvePostAuthRedirectPath(user);
    console.info("[auth] login_success", {
      userId: user.id,
      userType: user.user_type,
      redirectPath,
      clientIp,
    });
    res.json({
      success: true,
      message: "Login successful",
      user: {
        ...serializeAuthUser(user),
        sessionExpires: expiresAt.toISOString(),
      },
      redirectPath,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
};

// ... (refreshToken function is already correct below) ...

export const refreshToken = async (req, res) => {
  // Cookie is the canonical transport; body fallback supports curl/Postman.
  const incomingRefresh =
    req.cookies?.refresh_token || req.body?.refreshToken;

  if (!incomingRefresh) {
    return res
      .status(401)
      .json({ success: false, error: "Refresh token missing." });
  }

  try {
    // 1. Find the session and ensure it's not expired.
    // Select user_id AS id so the row matches the shape expected by
    // generateAccessToken(user) — which reads user.id, not user.user_id.
    // Without the alias, every refreshed access token contained
    // userId: undefined and the protect middleware would 401 the very next
    // request, producing a refresh-loop that the consolidated apiClient
    // surfaced (each retry hit /auth/token again).
    const sessionResult = await pool.query(
      `SELECT s.user_id AS id, s.expires_at, s.is_remembered,
              u.email, u.user_type, u.full_name
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.refresh_token = $1 AND s.expires_at > NOW()`,
      [incomingRefresh],
    );

    if (sessionResult.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid or expired session." });
    }

    const user = sessionResult.rows[0];

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();

    const rotateResult = await pool.query(
      `UPDATE sessions
       SET refresh_token = $1
       WHERE refresh_token = $2 AND expires_at > NOW()
       RETURNING id`,
      [newRefreshToken, incomingRefresh],
    );

    if (rotateResult.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid or expired session." });
    }

    setAuthCookies(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      isRemembered: !!user.is_remembered,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Refresh token error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error during token refresh." });
  }
};

// Helper function to generate a secure, short-lived token string
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // 1. Validate email input
  if (!email) {
    return res
      .status(400)
      .json({ success: false, error: "Email is required." });
  }

  try {
    // 2. Check if user exists (select ID only)
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    // --- IMPORTANT: Don't reveal if email exists ---
    if (userResult.rows.length === 0) {
      // Success response even if user not found, preventing enumeration attack
      return res.status(200).json({
        success: true,
        message:
          "If a matching account exists, a password reset email has been sent.",
      });
    }

    const userId = userResult.rows[0].id;
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // 3. Store token in the database
    await pool.query(
      `INSERT INTO password_reset_tokens (token, user_id, expires_at)
             VALUES ($1, $2, $3)`,
      [resetToken, userId, expiresAt],
    );

    // 4. Send reset email (Await is safe here, but can be non-blocking in production)
    await sendPasswordResetEmail(email.toLowerCase(), resetToken);

    await logAuthEvent({
      userId,
      eventType: "password_reset_requested",
      clientIp: getClientIp(req),
    });

    // 5. Final success response (same as above)
    res.status(200).json({
      success: true,
      message:
        "If a matching account exists, a password reset email has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while processing reset request.",
    });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ success: false, error: "Token and new password are required." });
  }

  try {
    // 1. Validate token existence, expiry, and usage
    const tokenResult = await pool.query(
      `SELECT user_id, expires_at, used_at FROM password_reset_tokens
             WHERE token = $1`,
      [token],
    );

    if (tokenResult.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid reset token." });
    }

    const resetRecord = tokenResult.rows[0];

    if (resetRecord.used_at) {
      return res
        .status(400)
        .json({ success: false, error: "Reset token has already been used." });
    }

    if (resetRecord.expires_at < new Date()) {
      return res
        .status(400)
        .json({ success: false, error: "Reset token has expired." });
    }

    const userId = resetRecord.user_id;

    // 2. Reject reuse of the current password
    const currentResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId],
    );

    if (currentResult.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "User account not found." });
    }

    const currentHash = currentResult.rows[0].password_hash;
    const sameAsOld = await bcrypt.compare(newPassword, currentHash);
    if (sameAsOld) {
      return res.status(400).json({
        success: false,
        error: "Cannot reuse your previous password. Choose a different one.",
      });
    }

    // 3. Hash the new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update the user's password hash and get the user's email
    const updateResult = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING email",
      [newHashedPassword, userId],
    );

    const userEmail = updateResult.rows[0].email;

    // 5. Invalidate the token (one-time use)
    await pool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1",
      [token],
    );

    // 6. Terminate all active sessions (security measure)
    await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);

    // 7. Send confirmation email
    await sendPasswordChangeConfirmationEmail(userEmail);

    await logAuthEvent({
      userId,
      eventType: "password_reset",
      clientIp: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while resetting password.",
    });
  }
};

export const logout = async (req, res) => {
  // Refresh token comes from the cookie now; body fallback for curl/Postman.
  const incomingRefresh =
    req.cookies?.refresh_token || req.body?.refreshToken;
  const userId = req.user.id;

  try {
    // Always clear the cookies — even if there's no matching session, we
    // still want the client's stale cookies gone.
    clearAuthCookies(res);

    if (incomingRefresh) {
      await pool.query(
        "DELETE FROM sessions WHERE user_id = $1 AND refresh_token = $2",
        [userId, incomingRefresh],
      );
    }

    await logAuthEvent({
      userId,
      eventType: "logout",
      clientIp: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully from current device.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error during logout." });
  }
};

export const logoutAll = async (req, res) => {
  // The user is identified via the Access Token by the 'protect' middleware.
  const userId = req.user.id;

  try {
    clearAuthCookies(res);

    // Delete ALL refresh tokens associated with the user ID.
    const result = await pool.query(
      "DELETE FROM sessions WHERE user_id = $1 RETURNING id",
      [userId],
    );

    await logAuthEvent({
      userId,
      eventType: "logout_all",
      clientIp: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: `Successfully logged out from ${result.rowCount} active sessions.`,
    });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      error: 'Server error during "Logout All" request.',
    });
  }
};

export const getActiveSessions = async (req, res) => {
  const userId = req.user.id;

  try {
    // Select relevant session data, excluding the refresh_token itself for security.
    const result = await pool.query(
      `SELECT 
                id, 
                is_remembered, 
                expires_at, 
                created_at, 
                client_ip,
                device_info 
             FROM sessions 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
      [userId],
    );

    // Note: The client_ip often only shows the IP of the proxy/VPN/load balancer.
    // You would typically use a library like 'ua-parser-js' on the server
    // to convert the User-Agent header (sent in req.headers) into device info
    // before saving it to the database for display here.

    res.status(200).json({
      success: true,
      sessions: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while retrieving sessions.",
    });
  }
};

export const revokeSession = async (req, res) => {
  const userId = req.user.id;
  const sessionId = req.params.sessionId;

  try {
    const result = await pool.query(
      `DELETE FROM sessions WHERE id = $1 AND user_id = $2 RETURNING id`,
      [sessionId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    await logAuthEvent({
      userId,
      eventType: "session_revoked",
      clientIp: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while revoking session.",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: serializeAuthUser(req.user),
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load current user",
    });
  }
};
