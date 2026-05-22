import rateLimit from "express-rate-limit";

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
