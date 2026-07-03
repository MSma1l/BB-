import rateLimit from "express-rate-limit";

/**
 * Rate limiters. The app runs behind nginx, so `trust proxy` is set in app.ts
 * and these key on the real client IP (X-Forwarded-For).
 */

/** Strict limiter for the admin login (brute-force protection). */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

/** Looser limiter for unauthenticated public writes (review/chat spam + DoS). */
export const publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

/**
 * Per-minute limiter for the public chat message-append endpoint (QA-3 QA3-4).
 * A shorter window than publicWriteLimiter so a script can't flood a
 * conversation, but generous enough for a brisk real back-and-forth.
 * Authenticated admins (operator replies) are exempt — `optionalAdmin` must run
 * before this so `req.admin` is set.
 */
export const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => Boolean((req as unknown as { admin?: unknown }).admin),
  message: { error: "Too many messages. Please slow down." },
});
