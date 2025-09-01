// src/middlewares/advancedRateLimit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { TooManyRequestsError } = require('common/core/error.response');

// Initialize Redis client with fallback to memory
let redisClient;
try {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  console.log('✅ Redis connected for rate limiting');
} catch (error) {
  console.warn('⚠️ Redis not available, falling back to memory-based rate limiting');
  redisClient = null;
}

const createAdvancedRateLimiter = (options) => {
  const config = {
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 5,
    message: options.message || 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
    
    // Use Redis if available, otherwise memory
    // store: redisClient ? RedisStore({
    //   sendCommand: (...args) => redisClient.call(...args),
    //   prefix: 'rate_limit:',
    // }) : undefined,
    
    keyGenerator: (req) => {
      // Generate unique key combining IP, user ID, and endpoint
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userId = req.user?.id || 'anonymous';
      const endpoint = req.route?.path || req.path;
      return `${ip}:${userId}:${endpoint}`;
    },
    
    handler: (req, res) => {
      throw new TooManyRequestsError(options.message || 'Rate limit exceeded');
    },
    
    onLimitReached: (req, res, options) => {
      console.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      
      // Log security event
      const auditData = {
        action: 'RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      };
      
      // Store in Redis for monitoring
      if (redisClient) {
        redisClient.lpush('security_events', JSON.stringify(auditData));
        redisClient.expire('security_events', 86400); // 24 hours
      }
    }
  };

  return rateLimit(config);
};

// Predefined rate limiters for different endpoints
const rateLimiters = {
  strict: createAdvancedRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many attempts. Please try again in 1 hour.'
  }),
  
  moderate: createAdvancedRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many requests. Please try again in 15 minutes.'
  }),
  
  lenient: createAdvancedRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests. Please slow down.'
  }),

  // Specific endpoint limits
  login: createAdvancedRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many login attempts. Account may be compromised.'
  }),
  
  register: createAdvancedRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many registration attempts.'
  }),
  
  passwordReset: createAdvancedRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2,
    message: 'Too many password reset attempts.'
  })
};

// Adaptive rate limiting based on user behavior
const adaptiveRateLimit = (req, res, next) => {
  const suspiciousPatterns = [
    req.headers['user-agent']?.includes('bot'),
    req.headers['user-agent']?.includes('curl'),
    !req.headers['user-agent'],
    req.ip?.includes('::1') || req.ip?.includes('127.0.0.1') // localhost
  ];
  
  const isSuspicious = suspiciousPatterns.some(Boolean);
  
  if (isSuspicious) {
    return rateLimiters.strict(req, res, next);
  }
  
  return rateLimiters.moderate(req, res, next);
};

module.exports = {
  createAdvancedRateLimiter,
  rateLimiters,
  adaptiveRateLimit
};
