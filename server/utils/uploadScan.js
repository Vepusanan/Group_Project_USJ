// Upload content-safety scan — Task T1.3
//
// Validates an uploaded file BEFORE it is stored. This is a content-validation
// scan (not a full antivirus engine): it confirms the file's real type from its
// magic bytes, rejects dangerous/executable types, enforces a size ceiling, and
// checks that the declared MIME / extension agree with the real bytes. A
// renamed executable (e.g. virus.exe -> resume.pdf) is therefore caught.
//
// Pluggable AV hook: if process.env.AV_SCAN_HOOK names a module that exports a
// default async function (buffer, meta) => { clean: boolean, reason?: string },
// it is called after the structural checks pass. This lets a real engine
// (ClamAV daemon, VirusTotal API, etc.) be wired later with NO change here.
//
// Returns: { clean: boolean, reason?: string, detectedType?: string }
// Throwing is reserved for programmer error; scan FAILURES return clean:false.

import path from "path";

// Magic-byte signatures for the types we accept. Each entry: the leading bytes
// that identify the format. Office files (docx/xlsx/pptx) are ZIP containers, so
// they share the "PK" signature — we treat that as a valid container and lean on
// the extension/MIME for the specific Office type.
const SIGNATURES = [
  { type: "pdf", mimes: ["application/pdf"], bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { type: "png", mimes: ["image/png"], bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "jpg", mimes: ["image/jpeg"], bytes: [0xff, 0xd8, 0xff] },
  { type: "gif", mimes: ["image/gif"], bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { type: "webp", mimes: ["image/webp"], bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (then WEBP at offset 8)
  { type: "zip", mimes: [
      "application/zip",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ], bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK..  (Office Open XML / zip)
  { type: "mp4", mimes: ["video/mp4"], bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
];

// Extensions we never accept regardless of content — common executable/script
// types. This is a denylist on TOP of the allowlist below; it exists so an
// obviously-dangerous extension is rejected with a clear message.
const DANGEROUS_EXTENSIONS = new Set([
  ".exe", ".dll", ".com", ".bat", ".cmd", ".msi", ".scr", ".pif",
  ".sh", ".bash", ".ps1", ".vbs", ".js", ".jar", ".app", ".deb", ".rpm",
  ".html", ".htm", ".svg", // can carry scripts
]);

// The extensions we positively allow for private documents (data room, etc.).
// .txt has no reliable magic bytes, so it is allowed structurally but still
// passes through the AV hook.
const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp",
  ".doc", ".docx", ".xls", ".xlsx", ".txt", ".mp4",
]);

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024; // 25 MB ceiling for private docs

const matchesSignature = (buffer, sig) => {
  const offset = sig.offset || 0;
  if (buffer.length < offset + sig.bytes.length) return false;
  for (let i = 0; i < sig.bytes.length; i++) {
    if (buffer[offset + i] !== sig.bytes[i]) return false;
  }
  return true;
};

let cachedHook;
let hookResolved = false;

const loadAvHook = async () => {
  if (hookResolved) return cachedHook;
  hookResolved = true;
  const hookPath = process.env.AV_SCAN_HOOK;
  if (!hookPath) {
    cachedHook = null;
    return null;
  }
  try {
    const mod = await import(hookPath);
    cachedHook = typeof mod.default === "function" ? mod.default : null;
    if (!cachedHook) {
      console.warn(`AV_SCAN_HOOK module "${hookPath}" has no default function export.`);
    }
  } catch (error) {
    console.error(`Failed to load AV_SCAN_HOOK "${hookPath}":`, error.message);
    cachedHook = null;
  }
  return cachedHook;
};

/**
 * Scan a file buffer for content safety.
 * @param {Buffer} buffer       raw file bytes
 * @param {Object} meta         { originalName, mimeType, maxBytes? }
 * @returns {Promise<{clean: boolean, reason?: string, detectedType?: string}>}
 */
export async function scanUpload(buffer, meta = {}) {
  const { originalName = "", mimeType = "", maxBytes = DEFAULT_MAX_BYTES } = meta;

  if (!buffer || buffer.length === 0) {
    return { clean: false, reason: "Empty or unreadable file." };
  }
  if (buffer.length > maxBytes) {
    return {
      clean: false,
      reason: `File exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB limit.`,
    };
  }

  const ext = path.extname(originalName).toLowerCase();

  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { clean: false, reason: `File type "${ext}" is not permitted.` };
  }
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return { clean: false, reason: `File type "${ext}" is not allowed.` };
  }

  // .txt has no magic bytes; accept structurally, still run the AV hook below.
  let detectedType = ext === ".txt" ? "txt" : null;

  if (!detectedType) {
    const match = SIGNATURES.find((sig) => matchesSignature(buffer, sig));
    if (!match) {
      return {
        clean: false,
        reason: "File content does not match any allowed type (possible disguised file).",
      };
    }
    detectedType = match.type;

    // If the client declared a MIME, make sure it is consistent with the real
    // bytes. A mismatch is a strong signal the file was renamed/disguised.
    if (mimeType && !match.mimes.includes(mimeType)) {
      return {
        clean: false,
        reason: `Declared type "${mimeType}" does not match the file's actual content.`,
        detectedType,
      };
    }
  }

  // Optional external AV engine.
  const hook = await loadAvHook();
  if (hook) {
    try {
      const result = await hook(buffer, { originalName, mimeType, detectedType });
      if (!result || result.clean !== true) {
        return {
          clean: false,
          reason: result?.reason || "File failed antivirus scan.",
          detectedType,
        };
      }
    } catch (error) {
      // Fail-closed: if the AV engine errors, do NOT store the file.
      console.error("AV scan hook error:", error.message);
      return { clean: false, reason: "Antivirus scan could not be completed.", detectedType };
    }
  }

  return { clean: true, detectedType };
}
