import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Strict limiter for endpoints that are credential-bearing or send email.
// Keeps a single IP from hammering login, password-reset, or
// resend-verification while still being generous enough for human use.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP per window
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false, // disable X-RateLimit-* (deprecated)
  message: {
    success: false,
    error:
      "Too many attempts from this IP. Please wait a few minutes and try again.",
  },
});

// Lighter limiter for general APIs to prevent runaway scrapers but not get
// in the way of normal authenticated browsing.
export const connectionRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.id ? String(req.user.id) : ipKeyGenerator(req.ip),
  message: {
    success: false,
    error:
      "You have sent too many connection requests today. Please try again tomorrow.",
  },
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
  },
});

// Per-user limit for AI-heavy endpoints (pitch deck, data room, NL search, meetings).
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_PER_HOUR || 30),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip),
  message: {
    success: false,
    error:
      "You have reached the hourly limit for AI features. Please try again later.",
  },
});

// Pitch deck session heartbeats — generous for 5s polling but blocks abuse.
export const pitchDeckSessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.PITCH_DECK_SESSION_RATE_PER_MIN || 120),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.id
      ? `pitch-session:${req.user.id}:${req.params.sessionId || "new"}`
      : ipKeyGenerator(req.ip),
  message: {
    success: false,
    error: "Too many pitch deck session updates. Please slow down.",
  },
});
