import express from "express";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  refreshToken,
} from "../controllers/authController.js";
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/token", refreshToken);


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
