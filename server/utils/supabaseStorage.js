import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Supabase client for storage operations
const supabaseUrl = process.env.SUPABASE_URL;
// Use service role key for storage operations, fallback to anon key
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client with your specific storage configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  storage: {
    region: process.env.SUPABASE_STORAGE_REGION || "ap-southeast-2",
    endpoint:
      process.env.SUPABASE_STORAGE_ENDPOINT ||
      "https://shvlqkqyvccflxtkhyqd.storage.supabase.co",
  },
});

// Storage bucket names (using your existing bucket names)
export const BUCKETS = {
  STARTUP_LOGOS: "startup_logo",
  STARTUP_TEAM_LOGO: "startup_team_logo",
  DOCUMENTS: "startup_documents",
  INVESTOR_PHOTOS: "investor_photos",
  MESSAGE_ATTACHMENTS: "message-attachments",
};

/**
 * Upload a file to Supabase Storage
 * @param {string} bucketName - Name of the storage bucket
 * @param {string} filePath - Local file path to upload
 * @param {string} fileName - Name to store the file as
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadToSupabase(
  bucketName,
  filePath,
  fileName,
  options = {}
) {
  try {
    // Read the file
    const fileBuffer = fs.readFileSync(filePath); // Get file extension and set content type
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

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType,
        cacheControl: "3600",
        upsert: options.overwrite || false,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    } // Get the public URL

    const { data: urlData } = supabase.storage
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
  const { error } = await supabase.storage
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
  const { data: urlData } = supabase.storage
    .from(BUCKETS.MESSAGE_ATTACHMENTS)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload and process startup logo
 * @param {string} filePath - Local file path
 * @param {string} startupId - Startup profile ID for naming
 * @returns {Promise<string>} Public URL of uploaded logo
 */
export async function uploadStartupLogo(filePath, startupId) {
  try {
    // Process image with sharp to ensure consistent size
    const processedPath = filePath.replace(/(\.[^.]+)$/, "_processed$1");
    await sharp(filePath)
      .resize({
        width: 400,
        height: 400,
        fit: "cover",
        withoutEnlargement: false,
      })
      .jpeg({ quality: 85 })
      .toFile(processedPath); // Generate unique filename

    const timestamp = Date.now();
    const fileName = `logo_${startupId}_${timestamp}.jpg`; // Upload to startup_logos bucket

    const result = await uploadToSupabase(
      BUCKETS.STARTUP_LOGOS,
      processedPath,
      fileName
    ); // Clean up temporary files

    try {
      fs.unlinkSync(filePath);
      fs.unlinkSync(processedPath);
    } catch (cleanupError) {
      console.warn(
        "Warning: Could not clean up temporary files:",
        cleanupError.message
      );
    }

    return result.publicUrl;
  } catch (error) {
    console.error("Error uploading startup logo:", error);
    throw error;
  }
}

/**
 * Upload and process investor photo
 * @param {string} filePath - Local file path
 * @param {string} investorId - Investor profile ID for naming
 * @returns {Promise<string>} Public URL of uploaded photo
 */
export async function uploadInvestorPhoto(filePath, investorId) {
  try {
    // Process image with sharp to ensure consistent size
    const processedPath = filePath.replace(/(\.[^.]+)$/, "_processed$1");
    await sharp(filePath)
      .resize({
        width: 400,
        height: 400,
        fit: "cover",
        withoutEnlargement: false,
      })
      .jpeg({ quality: 85 })
      .toFile(processedPath); // Generate unique filename

    const timestamp = Date.now();
    const fileName = `photo_${investorId}_${timestamp}.jpg`; // Upload to investor_photos bucket

    const result = await uploadToSupabase(
      BUCKETS.INVESTOR_PHOTOS,
      processedPath,
      fileName
    ); // Clean up temporary files

    try {
      fs.unlinkSync(filePath);
      fs.unlinkSync(processedPath);
    } catch (cleanupError) {
      console.warn(
        "Warning: Could not clean up temporary files:",
        cleanupError.message
      );
    }

    return result.publicUrl;
  } catch (error) {
    console.error("Error uploading investor photo:", error);
    throw error;
  }
}

/**
 * Upload and process startup team photo from buffer (Multer memory storage)
 * @param {Buffer} fileBuffer - The file buffer from Multer
 * @param {string} fileName - The name to store the file as
 * @param {string} mimeType - The file's MIME type
 * @returns {Promise<string>} Public URL of uploaded team photo
 */
export async function uploadTeamPhotoBuffer(
  fileBuffer,
  fileName,
  mimeType
) {
  const filePath = `team_photos/${fileName}`; // Subfolder within the bucket

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(BUCKETS.STARTUP_TEAM_LOGO)
    .upload(filePath, fileBuffer, {
      contentType: mimeType, // Use the detected MIME type
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Supabase team photo upload error: ${error.message}`
    );
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKETS.STARTUP_TEAM_LOGO)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload document to Supabase Storage
 * @param {string} filePath - Local file path
 * @param {string} originalName - Original filename
 * @param {string} startupId - Startup profile ID for naming
 * @returns {Promise<Object>} Document info with public URL
 */
export async function uploadDocument(filePath, originalName, startupId) {
  try {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path
      .basename(originalName, ext)
      .replace(/[^a-z0-9_-]/gi, "_");
    const fileName = `doc_${startupId}_${timestamp}_${baseName}${ext}`; // Upload to documents bucket

    const result = await uploadToSupabase(
      BUCKETS.DOCUMENTS,
      filePath,
      fileName
    ); // Get file size before cleanup

    const fileSize = fs.statSync(filePath).size || null; // Clean up temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn(
        "Warning: Could not clean up temporary file:",
        cleanupError.message
      );
    }

    return {
      name: originalName,
      url: result.publicUrl,
      size: fileSize,
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
    const { error } = await supabase.storage
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
    uploadDocument(file.path, file.originalname, startupId)
  );
  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Error uploading multiple documents:", error);
    throw error;
  }
}
