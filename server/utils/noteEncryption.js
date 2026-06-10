import crypto from "crypto";

const PREFIX = "enc:v1:";

const getKey = () => {
  const secret =
    process.env.CONNECTION_NOTES_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "dev-notes-key-change-me";
  return crypto.createHash("sha256").update(secret).digest();
};

export const encryptNote = (plaintext) => {
  if (!plaintext) return plaintext;
  if (String(plaintext).startsWith(PREFIX)) return plaintext;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
};

export const decryptNote = (stored) => {
  if (!stored) return stored;
  const value = String(stored);
  if (!value.startsWith(PREFIX)) return value;

  const payload = value.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) return value;

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};
