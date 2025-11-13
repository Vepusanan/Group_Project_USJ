import express from "express";
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  refreshToken,
} from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/token", refreshToken);

export default router;
