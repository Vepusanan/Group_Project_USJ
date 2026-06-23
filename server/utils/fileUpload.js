import multer from "multer";

const imageMime = ["image/jpeg", "image/png", "image/webp"];
const docMime = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "text/plain",
];

function fileFilter(req, file, cb) {
  if (imageMime.includes(file.mimetype) || docMime.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: images, pdf, docx, mp4, txt"));
  }
}

// Memory storage works on Vercel serverless (/tmp is ephemeral; buffers go to Supabase).
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

const videoFilter = (req, file, cb) => {
  if (file.mimetype === "video/mp4") {
    cb(null, true);
  } else {
    cb(new Error("Founder video must be an MP4 file"));
  }
};

export const videoUpload = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});
