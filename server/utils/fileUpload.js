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

// Per-field size caps (bytes). A multipart body can only be parsed once, so the
// profile routes use a single combined parser instead of chaining two multer
// instances (which truncates the stream and throws "Unexpected end of form").
const GENERAL_FILE_MAX = 15 * 1024 * 1024;
const VIDEO_FILE_MAX = 100 * 1024 * 1024;

export const PROFILE_FILE_LIMITS = { GENERAL_FILE_MAX, VIDEO_FILE_MAX };

const combinedFilter = (req, file, cb) => {
  if (file.fieldname === "founder_video") {
    return videoFilter(req, file, cb);
  }
  return fileFilter(req, file, cb);
};

// Single parser for the startup profile create/update routes. Limit is set to
// the largest allowed file (video); non-video fields are size-checked in the
// route handler since multer's limit is global to the request.
export const profileUpload = multer({
  storage,
  fileFilter: combinedFilter,
  limits: { fileSize: VIDEO_FILE_MAX },
});
