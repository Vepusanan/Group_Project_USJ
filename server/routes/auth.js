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
} from "../controllers/authController.js";
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/token", refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.get('/sessions', protect, getActiveSessions);


/* The Protected Test Route is a simple API endpoint you set up 
specifically to confirm that your entire JWT Authentication Middleware (protect) 
system is working correctly.
It's not meant to handle real application logic; its primary purpose is to be a 
reliable security canary—if you can successfully access it, you know your 
authentication system is fully functional. */
router.get("/protected-test", protect, (req, res) => {
  res.json({
    success: true,
    message: "You have accessed a protected route!",
    user: req.user,
  });
});

export default router;
