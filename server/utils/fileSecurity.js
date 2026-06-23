import fs from "fs";

const SIGNATURES = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

const matchesSignature = (buffer, signature) => {
  if (!buffer || buffer.length < signature.bytes.length) return false;
  return signature.bytes.every((byte, index) => buffer[index] === byte);
};

export const validateFileMagicBytes = (filePathOrBuffer, declaredMime) => {
  const buffer = Buffer.isBuffer(filePathOrBuffer)
    ? filePathOrBuffer
    : fs.readFileSync(filePathOrBuffer);
  if (!buffer.length) {
    return { ok: false, error: "Empty file" };
  }

  const mime = String(declaredMime || "").toLowerCase();

  if (mime.includes("pdf")) {
    if (!matchesSignature(buffer, SIGNATURES[0])) {
      return { ok: false, error: "File content does not match PDF format" };
    }
  } else if (mime.includes("jpeg") || mime.includes("jpg")) {
    if (!matchesSignature(buffer, SIGNATURES[1])) {
      return { ok: false, error: "File content does not match JPEG format" };
    }
  } else if (mime.includes("png")) {
    if (!matchesSignature(buffer, SIGNATURES[2])) {
      return { ok: false, error: "File content does not match PNG format" };
    }
  } else if (mime.includes("webp")) {
    if (!matchesSignature(buffer, SIGNATURES[3])) {
      return { ok: false, error: "File content does not match WebP format" };
    }
  }

  return { ok: true };
};

export const scanUploadedFile = async (
  filePathOrBuffer,
  { userId = null, context = "upload" } = {},
) => {
  if (process.env.ENABLE_MALWARE_SCAN === "true") {
    // Hook for external scanner integration (ClamAV, etc.)
    console.warn(
      `Malware scan requested for ${context} but no scanner is configured (user=${userId || "unknown"})`,
    );
  }
  return { clean: true };
};
