import multer from "multer";
import path from "path";
import { uploadDocumentBuffer } from "../utils/supabaseStorage.js";

// Multer Configuration for document uploads
// Use memory storage to get the file Buffer for direct Supabase upload.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit for documents
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOC, DOCX, and TXT documents
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, or TXT files are allowed."
        ),
        false
      );
    }
  },
}).fields([
  { name: "pitch_deck_url", maxCount: 1 },
  { name: "business_plan_url", maxCount: 1 },
]);

export const handleDocumentUploads = (req, res, next) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: `File upload failed: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    // Process uploaded documents
    const documentFields = ["pitch_deck_url", "business_plan_url"];
    const uploadedUrls = {};

    try {
      for (const fieldName of documentFields) {
        const files = req.files?.[fieldName];

        if (files && files.length > 0) {
          const file = files[0];
          const documentType = fieldName.replace("_url", ""); // Remove '_url' suffix

          // Upload buffer to Supabase with MIME type
          const publicUrl = await uploadDocumentBuffer(
            file.buffer,
            file.originalname,
            file.mimetype,
            documentType
          );

          // Store the URL to be added to request body
          uploadedUrls[fieldName] = publicUrl;
        }
      }

      // Add uploaded URLs to request body so they are saved in the database
      if (Object.keys(uploadedUrls).length > 0) {
        req.body = { ...req.body, ...uploadedUrls };
      }

      // Continue to the next middleware/handler
      next();
    } catch (processError) {
      console.error("Supabase Document Upload Process Error:", processError);
      return res.status(500).json({
        success: false,
        error: "Error processing document uploads.",
      });
    }
  });
};
