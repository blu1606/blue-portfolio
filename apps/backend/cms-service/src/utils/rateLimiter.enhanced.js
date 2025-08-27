// src/utils/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Rate limiter for anonymous feedback
const anonymousFeedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: {
        success: false,
        message: 'Too many feedback submissions from this IP. Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use IP address for rate limiting
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many feedback submissions from this IP. Please try again in 15 minutes.',
            retryAfter: '15 minutes'
        });
    }
});

// Rate limiter for authenticated feedback (more lenient)
const authenticatedFeedbackLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each user to 10 requests per hour
    message: {
        success: false,
        message: 'Too many feedback submissions. Please try again in 1 hour.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID for authenticated requests
        return req.user?.id || req.ip || 'unknown';
    }
});

// General API rate limiter
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again later.'
    }
});

module.exports = {
    anonymousFeedbackLimiter,
    authenticatedFeedbackLimiter,
    generalApiLimiter
};
