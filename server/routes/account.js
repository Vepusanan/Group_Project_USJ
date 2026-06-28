import express from "express";
import {
  changeEmail,
  verifyEmailChange,
  changePassword,
  deleteAccount,
  exportAccountData,
} from "../controllers/accountController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import {
  changeEmailValidator,
  changePasswordValidator,
  deleteAccountValidator,
} from "../validators/accountValidators.js";

const router = express.Router();

// All account routes require authentication; mutating routes validate input.
router.put("/email", protect, validate(changeEmailValidator), changeEmail);
router.get("/verify-email-change", verifyEmailChange);
router.put(
  "/password",
  protect,
  validate(changePasswordValidator),
  changePassword,
);
router.delete("/", protect, validate(deleteAccountValidator), deleteAccount);
router.get("/export", protect, exportAccountData);

export default router;
