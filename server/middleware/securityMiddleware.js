const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Strict rate limiter for authentication attempts (e.g., /api/auth/login)
 * Limit: 10 requests per 15-minute window per IP.
 */
const isProd = process.env.NODE_ENV === 'production';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 15 : 200,
  limit: isProd ? 15 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * General API rate limiter for /api/* routes
 * Limit: 300 requests per 15-minute window per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Helmet middleware configured with cross-origin resource policy,
 * X-Frame-Options, X-Content-Type-Options, and Referrer-Policy (Task 119).
 */
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  xFrameOptions: { action: 'sameorigin' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Custom middleware enforcing baseline security headers across all routes.
 */
function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

module.exports = {
  authLimiter,
  apiLimiter,
  helmetMiddleware,
  securityHeadersMiddleware,
};
