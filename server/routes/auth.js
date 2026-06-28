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
import { validate } from "../middleware/validation.js";
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  resendVerificationValidator,
} from "../validators/authValidators.js";

const router = express.Router();

// Public routes — credential-bearing and email-sending endpoints are
// rate-limited by IP to slow down brute-force and email abuse, and have their
// input validated/sanitised before reaching the controller.
router.post("/register", authLimiter, validate(registerValidator), register);
router.post("/login", authLimiter, validate(loginValidator), login);
router.get("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationValidator),
  resendVerification,
);
router.post("/token", refreshToken);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordValidator),
  forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordValidator),
  resetPassword,
);
router.post("/logout", protect, logout);
router.post("/logout-all", protect, logoutAll);
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);
router.get("/me", protectSession, getCurrentUser);

export default router;
