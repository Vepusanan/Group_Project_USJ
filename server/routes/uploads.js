import express from "express";
import { protect } from "../middleware/auth.js";
import { handleMessageAttachment } from "../middleware/messageUpload.js";

const router = express.Router();

// POST /api/uploads/message - Uploads file, validates it, and returns a secure public URL from Supabase.
router.post("/message", protect, handleMessageAttachment, (req, res) => {
  // This function executes only on success after handleMessageAttachment
  if (req.attachmentUrl) {
    return res.status(200).json({
      success: true,
      message: "File uploaded and URL generated.",
      attachmentUrl: req.attachmentUrl,
      fileName: req.file.originalname,
    });
  }
  // Should be caught by middleware, but kept as a fallback
  return res
    .status(500)
    .json({ success: false, error: "Failed to retrieve attachment URL." });
});

export default router;
