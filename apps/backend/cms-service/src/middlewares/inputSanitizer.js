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
  return validator.escape(str.replace(/\0/g, '').trim());
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
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

const feedbackSanitizer = inputSanitizer({
  allowedFields: ['authorName', 'authorEmail', 'content', 'rating']
});

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
