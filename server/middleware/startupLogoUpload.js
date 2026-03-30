import multer from "multer";
import path from "path";
import { uploadStartupLogoBuffer } from "../utils/supabaseStorage.js";

// Multer Configuration for startup logo uploads
// Use memory storage to get the file Buffer for direct Supabase upload.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit for logos
  fileFilter: (req, file, cb) => {
    // Accept JPG, PNG, WebP, and GIF images
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPG, PNG, GIF, or WebP images are allowed."
        ),
        false
      );
    }
  },
}).single("startup_logo"); // 'startup_logo' is the expected field name

export const handleStartupLogoUpload = (req, res, next) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: `File upload failed: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    // If no file is provided, continue (logo is optional)
    if (!req.file) {
      return next();
    }

    try {
      const userId = req.user.id; // From 'protect' middleware
      const fileExtension = path.extname(req.file.originalname);

      // Generate unique filename: user_id/timestamp-random.ext
      const fileName = `${userId}_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}${fileExtension}`;

      // Upload buffer to Supabase with MIME type
      const publicUrl = await uploadStartupLogoBuffer(
        req.file.buffer,
        fileName,
        req.file.mimetype
      );

      // Attach the final URL to the request body so it can be saved in the database
      req.body.startup_logo_url = publicUrl;

      // Continue to the next middleware/handler
      next();
    } catch (processError) {
      console.error("Supabase Logo Upload Process Error:", processError);
      return res.status(500).json({
        success: false,
        error: "Error processing logo upload.",
      });
    }
  });
};
