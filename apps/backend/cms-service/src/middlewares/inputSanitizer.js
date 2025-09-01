// src/middlewares/inputSanitizer.js
const validator = require('validator');
const { BadRequestError } = require('common/core/error.response');

/**
 * Input Sanitization Middleware
 * Cleans and validates input data before processing
 */

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  // Remove null bytes and trim whitespace
  let s = str.replace(/\0/g, '').trim();

  // Remove script tags entirely to prevent XSS but preserve other
  // special characters (tests expect raw symbols like & and < > to remain)
  s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

  // Remove inline event handlers like onclick="..." to be safer
  s = s.replace(/on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Collapse excessive whitespace
  return s.replace(/\s{2,}/g, ' ');
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizeString(item);
      } else if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item);
      } else {
        return item;
      }
    });
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value); // This will now handle arrays properly
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

const inputSanitizer = (options = {}) => {
  const { 
    sanitizeBody = true, 
    sanitizeQuery = true, 
    sanitizeParams = true,
    allowedFields = null 
  } = options;
  
  return (req, res, next) => {
    try {
      // Sanitize request body
      if (sanitizeBody && req.body) {
        req.body = sanitizeObject(req.body);
        
        // Filter allowed fields if specified
        if (allowedFields && Array.isArray(allowedFields)) {
          const filtered = {};
          allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
              filtered[field] = req.body[field];
            }
          });
          req.body = filtered;
        }
      }
      
      // Sanitize query parameters
      if (sanitizeQuery && req.query) {
        req.query = sanitizeObject(req.query);
      }
      
      // Sanitize route parameters
      if (sanitizeParams && req.params) {
        req.params = sanitizeObject(req.params);
      }
      
      next();
    } catch (error) {
      throw new BadRequestError('Invalid input data');
    }
  };
};

// Specific sanitizers for different routes
const postSanitizer = inputSanitizer({
  allowedFields: ['title', 'content', 'contentType', 'isPublished', 'tags']
});

const feedbackSanitizer = (req, res, next) => {
  // First apply standard sanitization
  inputSanitizer({
    allowedFields: ['authorName', 'authorEmail', 'content', 'rating']
  })(req, res, (err) => {
    if (err) return next(err);
    
    // Convert rating from string to integer if present
    if (req.body.rating !== undefined) {
      if (typeof req.body.rating === 'string') {
        const numericRating = parseInt(req.body.rating, 10);
        if (!isNaN(numericRating)) {
          req.body.rating = numericRating;
        }
      }
    }
    
    next();
  });
};

const commentSanitizer = inputSanitizer({
  allowedFields: ['content', 'postId', 'parentId']
});

module.exports = {
  inputSanitizer,
  postSanitizer,
  feedbackSanitizer,
  commentSanitizer,
  sanitizeString,
  sanitizeObject
};
