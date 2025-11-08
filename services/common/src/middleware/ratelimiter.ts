import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // per IP
  standardHeaders: true,
  legacyHeaders: false
});

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20
});
