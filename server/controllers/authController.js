import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { sendVerificationEmail } from "../utils/emailServices.js";
import { lockAccountIfNecessary } from "../utils/loginSecurity.js";
//auth business logic

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, fullName, userType } = req.body;

    // Validation
    if (!email || !password || !fullName || !userType) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    if (!["startup", "investor"].includes(userType)) {
      return res.status(400).json({
        success: false,
        error: "User type must be startup or investor",
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Generate verification token (JWT valid for 24 hours)
    const verificationToken = jwt.sign(
      { email: email.toLowerCase() },
      process.env.JWT_VERIFY_SECRET, // Use a separate secret for verification
      { expiresIn: "24h" }
    );

    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // 2. Insert user with token and set email_verified to false
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, user_type, email_verified, email_verification_token, email_verification_token_expires) 
       VALUES ($1, $2, $3, $4, false, $5, $6) 
       RETURNING id, email, full_name, user_type, created_at, email_verification_token, email_verification_token_expires`,
      [
        email.toLowerCase(),
        hashedPassword,
        fullName,
        userType,
        verificationToken,
        tokenExpiration,
      ]
    );

    const user = result.rows[0];

    // 3. Send verification email
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
    // You might want to delete the user record if the email failed to send,
    // but typically you let them try again or resend the email later.
    res.status(500).json({
      success: false,
      error: "Server error during registration",
    });
  }
};

// Verify email address
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Verification failed: Token is missing.");
    }

    // 1. Verify the token's signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_VERIFY_SECRET);
    const userEmail = decoded.email;

    // 2. Find the user by token and ensure it's not expired
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE email = $1 
         AND email_verification_token = $2 
         AND email_verification_token_expires > NOW()`,
      [userEmail, token]
    );

    if (result.rows.length === 0) {
      // The token is either invalid, already used, or expired
      return res
        .status(401)
        .send("Verification failed: Invalid or expired token.");
    }

    // 3. Update the user record: set email_verified to true and clear token fields
    await pool.query(
      `UPDATE users 
       SET email_verified = true, 
           email_verification_token = NULL, 
           email_verification_token_expires = NULL 
       WHERE id = $1`,
      [result.rows[0].id]
    );

    // Redirect or send a success message (redirect is common for verification links)
    // You can redirect to your frontend login page or a success page
    res.send("Email verified successfully! You can now log in.");
  } catch (error) {
    console.error("Email verification error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).send("Verification failed: Token has expired.");
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send("Verification failed: Invalid token.");
    }
    res.status(500).send("Server error during email verification.");
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if email is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required.",
      });
    }

    // 2. Check if user exists
    const result = await pool.query(
      "SELECT id, email_verified FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Return a non-specific success message to avoid user enumeration attacks
      return res.status(200).json({
        success: true,
        message:
          "If the email address is associated with an unverified account, a new verification link has been sent.",
      });
    }

    const user = result.rows[0];

    // 3. Check if user is already verified
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: "This account is already verified.",
      });
    }

    // 4. Generate new token
    const newVerificationToken = jwt.sign(
      { email: email.toLowerCase() },
      process.env.JWT_VERIFY_SECRET,
      { expiresIn: "24h" } // Reset expiration to 24 hours from now
    );

    const tokenExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 5. Update user with new token and expiration
    await pool.query(
      `UPDATE users 
       SET email_verification_token = $1, 
           email_verification_token_expires = $2 
       WHERE id = $3`,
      [newVerificationToken, tokenExpiration, user.id]
    );

    // 6. Send new verification email
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
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, password_hash, email_verified, full_name, user_type, failed_login_attempts, account_locked_until FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // --- THIS BLOCK MUST EXECUTE ON FAILURE ---
      const failedResult = await lockAccountIfNecessary(
        user.id,
        user.failed_login_attempts,
        user.email
      );
      // Check if the failure triggered a lock
      if (failedResult.locked) {
        return res.status(403).json({
          success: false,
          error: "Too many failed login attempts. Account locked for 1 hour.",
          lockedUntil: failedResult.lockUntil.toISOString(),
        });
      }
      // Return generic error for security
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // 1. Check if the email is verified
    if (!user.email_verified) {
      // You can also send a response that allows the user to trigger a resend email action
      return res.status(403).json({
        success: false,
        error:
          "Account is not verified. Please check your email for the verification link.",
        emailVerified: false, // <-- Add this flag for frontend handling
      });
    }

    // Generate JWT token (only if verified)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.user_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
};

// Function to generate a new short-lived access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, userType: user.user_type },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Standard short-lived access token
  );
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, error: "Refresh token missing." });
  }

  try {
    // 1. Find the session and ensure it's not expired
    const sessionResult = await pool.query(
      `SELECT s.user_id, s.expires_at, u.email, u.user_type 
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.refresh_token = $1 AND s.expires_at > NOW()`,
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid or expired session." });
    }

    const session = sessionResult.rows[0];

    // 2. Generate a new access token
    const newAccessToken = generateAccessToken(session);

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error during token refresh." });
  }
};
