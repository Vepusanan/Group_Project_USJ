import express from "express";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
  getActiveSessions,
  revokeSession,
  getCurrentUser,
} from "../controllers/authController.js";
import { protect, protectSession } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes — credential-bearing and email-sending endpoints are
// rate-limited by IP to slow down brute-force and email abuse.
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/token", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/logout", protect, logout);
router.post("/logout-all", protect, logoutAll);
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);
router.get("/me", protectSession, getCurrentUser);

export default router;
