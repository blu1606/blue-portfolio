// src/middlewares/sanitization.js
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid input data'
    });
  }
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove HTML tags and potentially dangerous characters
      sanitized[key] = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {}
      });
      
      // Additional validation for common fields
      if (key === 'email') {
        sanitized[key] = validator.isEmail(sanitized[key]) ? sanitized[key] : '';
      }
      
      // Normalize and trim
      sanitized[key] = validator.escape(sanitized[key].trim());
      
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

const preventXSS = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

module.exports = {
  sanitizeInput,
  preventXSS
};
