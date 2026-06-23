import jwt from "jsonwebtoken";
import { recordUserPresence } from "../utils/userPresence.js";

const REALTIME_TOKEN_TTL_SECONDS = 60 * 60;

export const getRealtimeToken = (req, res) => {
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    return res.status(503).json({
      success: false,
      error: "Realtime is not configured on the server.",
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      sub: req.user.id,
      role: "authenticated",
      aud: "authenticated",
      iat: now,
      exp: now + REALTIME_TOKEN_TTL_SECONDS,
    },
    secret,
  );

  return res.status(200).json({
    success: true,
    token,
    expiresIn: REALTIME_TOKEN_TTL_SECONDS,
  });
};

export const updatePresence = async (req, res) => {
  try {
    await recordUserPresence(req.user.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Presence update error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to update presence.",
    });
  }
};
