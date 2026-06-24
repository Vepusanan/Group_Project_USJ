import {
  BUCKETS,
  parseLegacyStorageFromUrl,
} from "./supabaseStorage.js";
import { createHttpError } from "./pitchDeckFetch.js";

const ALLOWED_STORAGE_HOSTS = (process.env.ALLOWED_STORAGE_HOSTS || "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

const assertAllowedStorageHost = (url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw createHttpError(400, "Invalid attachment URL");
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw createHttpError(400, "Attachment URL must be HTTP(S)");
  }

  const host = parsed.hostname.toLowerCase();
  const allowed =
    ALLOWED_STORAGE_HOSTS.length === 0
      ? host.endsWith(".supabase.co")
      : ALLOWED_STORAGE_HOSTS.some(
          (allowedHost) =>
            host === allowedHost || host.endsWith(`.${allowedHost}`),
        );

  if (!allowed) {
    throw createHttpError(400, "Attachment URL host is not allowed");
  }

  return parsed;
};

export const assertAllowedMessageAttachmentUrl = (url, senderUserId) => {
  if (!url) return;

  assertAllowedStorageHost(url);

  const parsed = parseLegacyStorageFromUrl(url);
  if (!parsed || parsed.bucket !== BUCKETS.MESSAGE_ATTACHMENTS) {
    throw createHttpError(400, "Attachment must be uploaded via the platform");
  }

  const expectedPrefix = `messages/${senderUserId}_`;
  if (!parsed.path.startsWith(expectedPrefix)) {
    throw createHttpError(403, "Attachment URL does not belong to you");
  }
};
