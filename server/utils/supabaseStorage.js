import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let supabaseClient = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_KEY).",
    );
  }

  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const storageEndpoint =
    process.env.SUPABASE_STORAGE_ENDPOINT ||
    (projectRef ? `https://${projectRef}.storage.supabase.co` : undefined);

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    storage: {
      region: process.env.SUPABASE_STORAGE_REGION || "ap-southeast-2",
      ...(storageEndpoint ? { endpoint: storageEndpoint } : {}),
    },
  });

  return supabaseClient;
}

// Storage bucket names (using your existing bucket names)
export const BUCKETS = {
  STARTUP_LOGOS: "startup_logo",
  DOCUMENTS: "startup_documents",
  INVESTOR_PHOTOS: "investor_photos",
  MESSAGE_ATTACHMENTS: "message-attachments",
};

export const DATA_ROOM_SIGNED_URL_SECONDS = 15 * 60;

function readFileSource(source) {
  if (Buffer.isBuffer(source)) return source;
  if (source?.buffer) return source.buffer;
  if (typeof source === "string") return fs.readFileSync(source);
  if (source?.path) return fs.readFileSync(source.path);
  throw new Error("Invalid file source for upload");
}

export async function downloadStorageObject(bucketName, objectPath) {
  const { data, error } = await getSupabase().storage
    .from(bucketName)
    .download(objectPath);

  if (error) {
    throw new Error(`Storage download failed: ${error.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function createSignedStorageUrl(
  bucketName,
  objectPath,
  expiresInSeconds = DATA_ROOM_SIGNED_URL_SECONDS,
) {
  const { data, error } = await getSupabase().storage
    .from(bucketName)
    .createSignedUrl(objectPath, expiresInSeconds);

  if (error) {
    throw new Error(`Signed URL generation failed: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    expiresIn: expiresInSeconds,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  };
}

export const parseLegacyStorageFromUrl = (fileUrl) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("storage://")) {
    const withoutScheme = fileUrl.slice("storage://".length);
    const slash = withoutScheme.indexOf("/");
    if (slash <= 0) return null;
    return {
      bucket: withoutScheme.slice(0, slash),
      path: withoutScheme.slice(slash + 1),
    };
  }

  try {
    const url = new URL(fileUrl);
    const marker = "/object/public/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    const remainder = url.pathname.slice(idx + marker.length);
    const slash = remainder.indexOf("/");
    if (slash <= 0) return null;
    return {
      bucket: remainder.slice(0, slash),
      path: decodeURIComponent(remainder.slice(slash + 1)),
    };
  } catch {
    return null;
  }
};

/**
 * Upload a file to Supabase Storage
 * @param {string} bucketName - Name of the storage bucket
 * @param {Buffer|string|{ buffer?: Buffer, path?: string }} source - File buffer or Multer file
 * @param {string} fileName - Name to store the file as
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadToSupabase(
  bucketName,
  source,
  fileName,
  options = {}
) {
  try {
    const fileBuffer = readFileSource(source);
    const ext = path.extname(fileName).toLowerCase();
    let contentType = "application/octet-stream";
    if ([".jpg", ".jpeg"].includes(ext)) contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".doc") contentType = "application/msword";
    else if (ext === ".docx")
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".txt") contentType = "text/plain"; // Upload to Supabase Storage

    const { data, error } = await getSupabase().storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: options.overwrite || false,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    } // Get the public URL

    const { data: urlData } = getSupabase().storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      success: true,
      path: data.path,
      fullPath: data.fullPath,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error("Error uploading to Supabase:", error);
    throw error;
  }
}

/**
 * Uploads a file buffer directly to the message attachments bucket.
 * This is designed for use with Multer's memory storage.
 * @param {Buffer} fileBuffer - The file buffer from Multer.
 * @param {string} fileName - The name to store the file as.
 * @param {string} mimeType - The file's MIME type (for Supabase content-type).
 * @returns {Promise<string>} Public URL of the uploaded attachment.
 */
export async function uploadMessageAttachmentBuffer(
  fileBuffer,
  fileName,
  mimeType
) {
  const filePath = `messages/${fileName}`; // Subfolder within the bucket

  // Upload to Supabase Storage
  const { error } = await getSupabase().storage
    .from(BUCKETS.MESSAGE_ATTACHMENTS)
    .upload(filePath, fileBuffer, {
      contentType: mimeType, // Use the detected MIME type
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Supabase message attachment upload error: ${error.message}`
    );
  }

  // Get the public URL
  const { data: urlData } = getSupabase().storage
    .from(BUCKETS.MESSAGE_ATTACHMENTS)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload and process startup logo
 * @param {{ buffer: Buffer, path?: string }|Buffer|string} file - Multer file or buffer
 * @param {string} startupId - Startup profile ID for naming
 * @returns {Promise<string>} Public URL of uploaded logo
 */
export async function uploadStartupLogo(file, startupId) {
  try {
    const processedBuffer = await sharp(readFileSource(file))
      .resize({
        width: 400,
        height: 400,
        fit: "cover",
        withoutEnlargement: false,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const fileName = `logo_${startupId}_${Date.now()}.jpg`;
    const result = await uploadToSupabase(
      BUCKETS.STARTUP_LOGOS,
      processedBuffer,
      fileName,
    );

    return result.publicUrl;
  } catch (error) {
    console.error("Error uploading startup logo:", error);
    throw error;
  }
}

/**
 * Upload and process investor photo
 * @param {{ buffer: Buffer, path?: string }|Buffer|string} file - Multer file or buffer
 * @param {string} investorId - Investor profile ID for naming
 * @returns {Promise<string>} Public URL of uploaded photo
 */
export async function uploadInvestorPhoto(file, investorId) {
  try {
    const processedBuffer = await sharp(readFileSource(file))
      .resize({
        width: 400,
        height: 400,
        fit: "cover",
        withoutEnlargement: false,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const fileName = `photo_${investorId}_${Date.now()}.jpg`;
    const result = await uploadToSupabase(
      BUCKETS.INVESTOR_PHOTOS,
      processedBuffer,
      fileName,
    );

    return result.publicUrl;
  } catch (error) {
    console.error("Error uploading investor photo:", error);
    throw error;
  }
}

/**
 * Upload document to Supabase Storage
 * @param {string} filePath - Local file path
 * @param {string} originalName - Original filename
 * @param {string} startupId - Startup profile ID for naming
 * @returns {Promise<Object>} Document info with public URL
 */
export async function uploadVerificationDocument(file, userId) {
  const originalName = file.originalname || "verification-document";
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-z0-9_-]/gi, "_");
  const fileName = `verification/${userId}/doc_${timestamp}_${baseName}${ext}`;

  const result = await uploadToSupabase(BUCKETS.DOCUMENTS, file, fileName);

  return { url: result.publicUrl, name: originalName };
}

export async function uploadDataRoomDocument(
  file,
  originalName,
  startupProfileId,
) {
  try {
    const fileBuffer = readFileSource(file);
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path
      .basename(originalName, ext)
      .replace(/[^a-z0-9_-]/gi, "_");
    const fileName = `data-room/${startupProfileId}/doc_${timestamp}_${baseName}${ext}`;

    const result = await uploadToSupabase(
      BUCKETS.DOCUMENTS,
      fileBuffer,
      fileName,
    );

    return {
      name: originalName,
      bucket: BUCKETS.DOCUMENTS,
      path: fileName,
      size: fileBuffer.length,
      internalUrl: `storage://${BUCKETS.DOCUMENTS}/${fileName}`,
    };
  } catch (error) {
    console.error("Error uploading data room document:", error);
    throw error;
  }
}

export async function uploadFounderVideo(file, startupId) {
  try {
    const fileName = `founder-videos/${startupId}/video_${Date.now()}.mp4`;

    const result = await uploadToSupabase(
      BUCKETS.DOCUMENTS,
      file,
      fileName,
      { overwrite: true },
    );

    return result.publicUrl;
  } catch (error) {
    console.error("Error uploading founder video:", error);
    throw error;
  }
}

export async function uploadFounderVideoThumbnail(file, startupId) {
  try {
    const processedBuffer = await sharp(readFileSource(file))
      .resize({ width: 640, height: 360, fit: "cover", withoutEnlargement: false })
      .jpeg({ quality: 80 })
      .toBuffer();

    const fileName = `founder-videos/${startupId}/thumb_${Date.now()}.jpg`;

    const result = await uploadToSupabase(
      BUCKETS.DOCUMENTS,
      processedBuffer,
      fileName,
      { overwrite: true },
    );

    return result.publicUrl;
  } catch (error) {
    console.error("Error uploading founder video thumbnail:", error);
    throw error;
  }
}

export async function uploadDocument(file, originalName, startupId) {
  try {
    const fileBuffer = readFileSource(file);
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path
      .basename(originalName, ext)
      .replace(/[^a-z0-9_-]/gi, "_");
    const fileName = `doc_${startupId}_${timestamp}_${baseName}${ext}`;

    const result = await uploadToSupabase(
      BUCKETS.DOCUMENTS,
      fileBuffer,
      fileName,
    );

    return {
      name: originalName,
      url: result.publicUrl,
      size: fileBuffer.length,
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage
 * @param {string} bucketName - Name of the storage bucket
 * @param {string} filePath - Path of file to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFromSupabase(bucketName, filePath) {
  try {
    const { error } = await getSupabase().storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error("Error deleting from Supabase:", error);
    return false;
  }
}

/**
 * Extract file path from Supabase public URL
 * @param {string} publicUrl - Supabase public URL
 * @param {string} bucketName - Name of the storage bucket
 * @returns {string|null} File path or null if invalid URL
 */
export function extractFilePathFromUrl(publicUrl, bucketName) {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf(bucketName);
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join("/");
    }
    return null;
  } catch (error) {
    console.error("Error extracting file path from URL:", error);
    return null;
  }
}

/**
 * Process multiple document uploads
 * @param {Array} files - Array of uploaded files
 * @param {string} startupId - Startup profile ID
 * @returns {Promise<Array>} Array of document info objects
 */
export async function uploadMultipleDocuments(files, startupId) {
  const uploadPromises = files.map((file) =>
    uploadDocument(file, file.originalname, startupId),
  );
  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Error uploading multiple documents:", error);
    throw error;
  }
}
