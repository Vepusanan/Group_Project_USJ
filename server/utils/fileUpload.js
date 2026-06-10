import path from "path";
import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "_");
    const fileName = `${Date.now()}_${base}${ext}`;
    cb(null, fileName);
  },
});

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

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB per file
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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB for founder video
});

export async function processImage(filePath) {
  try {
    const outPath = filePath.replace(/(\.[^.]+)$/, "_resized$1");
    await sharp(filePath).resize({ width: 1200, withoutEnlargement: true }).toFile(outPath);
    // keep both original and resized (resized preferred)
    return outPath;
  } catch (err) {
    // if processing fails, return original path
    return filePath;
  }
}

export function fileUrlFor(filePath) {
  // For local testing we return a relative URL path the server can serve later if needed
  // Example: /uploads/filename
  const fileName = path.basename(filePath);
  return `/uploads/${fileName}`;
}
