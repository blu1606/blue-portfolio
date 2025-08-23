const rateLimit = require('express-rate-limit');
const { TooManyRequestsError } = require('common/core/error.response');

const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
    max: options.max || 5, // 5 attempts default
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw new TooManyRequestsError(options.message || 'Rate limit exceeded');
    },
    keyGenerator: (req) => {
      // Use IP + user ID if authenticated, otherwise just IP
      return req.user?.id ? `${req.ip}-${req.user.id}` : req.ip;
    }
  });
};

const rateLimitConfigs = {
  'register': { max: 5, windowMs: 60 * 60 * 1000, message: 'Too many registration attempts' },
  'login': { max: 10, windowMs: 60 * 60 * 1000, message: 'Too many login attempts' },
  'otp-request': { max: 3, windowMs: 60 * 60 * 1000, message: 'Too many OTP requests' },
  'otp-validate': { max: 5, windowMs: 15 * 60 * 1000, message: 'Too many OTP validation attempts' },
  'password-reset': { max: 3, windowMs: 60 * 60 * 1000, message: 'Too many password reset attempts' },
  'change-password': { max: 5, windowMs: 60 * 60 * 1000, message: 'Too many password change attempts' },
  'refresh': { max: 20, windowMs: 60 * 60 * 1000, message: 'Too many token refresh attempts' },
  'resend-verification': { max: 3, windowMs: 60 * 60 * 1000, message: 'Too many verification resend attempts' }
};

const rateLimitMiddleware = (type) => {
  const config = rateLimitConfigs[type];
  if (!config) {
    throw new Error(`Unknown rate limit type: ${type}`);
  }
  return createRateLimiter(config);
};

module.exports = { rateLimitMiddleware };