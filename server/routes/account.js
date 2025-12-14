import express from "express";
import {
  changeEmail,
  verifyEmailChange,
  changePassword,
  deleteAccount,
  exportUserData,
  downloadExportedData,
} from "../controllers/accountController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All account routes require authentication
router.put("/email", protect, changeEmail);
router.get("/verify-email-change", verifyEmailChange);
router.put("/password", protect, changePassword);
router.delete("/", protect, deleteAccount);

// Data export routes
router.get("/export", protect, exportUserData);
router.get("/export/download", downloadExportedData);

export default router;

