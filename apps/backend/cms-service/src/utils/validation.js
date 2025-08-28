// src/utils/validation.js
const { BadRequestError } = require('common/core/error.response');

/**
 * CMS Service Validation Utilities
 * Centralized validation logic for consistency and file uploads
 */

// File validation constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = /jpeg|jpg|png|gif|webp/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_FEEDBACK = 5; // 1 avatar + 4 images
const MAX_FILES_POST = 10;

const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    throw new BadRequestError(`${fieldName} is required`);
  }
};

const validateString = (value, fieldName, minLength = 0, maxLength = Infinity) => {
  if (typeof value !== 'string') {
    throw new BadRequestError(`${fieldName} must be a string`);
  }
  
  if (value.length < minLength) {
    throw new BadRequestError(`${fieldName} must be at least ${minLength} characters long`);
  }
  
  if (value.length > maxLength) {
    throw new BadRequestError(`${fieldName} must not exceed ${maxLength} characters`);
  }
};

const validateNumber = (value, fieldName, min = -Infinity, max = Infinity) => {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new BadRequestError(`${fieldName} must be a valid number`);
  }
  
  if (num < min) {
    throw new BadRequestError(`${fieldName} must be at least ${min}`);
  }
  
  if (num > max) {
    throw new BadRequestError(`${fieldName} must not exceed ${max}`);
  }
  
  return num;
};

const validateEmail = (email) => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError('Please provide a valid email address');
  }
  
  return email.toLowerCase().trim();
};

const validateRating = (rating) => {
  if (!rating) return null;
  
  const num = validateNumber(rating, 'Rating', 1, 5);
  return Math.floor(num);
};

const validatePagination = (limit, offset) => {
  const limitNum = limit ? validateNumber(limit, 'Limit', 1, 100) : 20;
  const offsetNum = offset ? validateNumber(offset, 'Offset', 0) : 0;
  
  return { limit: limitNum, offset: offsetNum };
};

// Content validation
const validateContent = (content, minLength = 10, maxLength = 2000) => {
  validateRequired(content, 'Content');
  validateString(content, 'Content', minLength, maxLength);
  
  // Basic content sanitization
  return content.trim();
};

// Post-specific validations
const validatePostData = (title, content, contentType = 'html') => {
  validateRequired(title, 'Title');
  validateString(title, 'Title', 1, 255);
  
  const validatedContent = validateContent(content);
  
  const allowedContentTypes = ['html', 'markdown'];
  if (!allowedContentTypes.includes(contentType)) {
    throw new BadRequestError('Content type must be either html or markdown');
  }
  
  return {
    title: title.trim(),
    content: validatedContent,
    contentType
  };
};

// Feedback-specific validations
const validateFeedbackData = (data) => {
  const { authorName, authorEmail, content, rating, isAnonymous } = data;
  
  const validatedContent = validateContent(content);
  
  // Anonymous feedback requires author name
  if (isAnonymous) {
    validateRequired(authorName, 'Author name');
    validateString(authorName, 'Author name', 1, 100);
  }
  
  const validatedEmail = authorEmail ? validateEmail(authorEmail) : null;
  const validatedRating = rating ? validateRating(rating) : null;
  
  return {
    authorName: authorName ? authorName.trim() : null,
    authorEmail: validatedEmail,
    content: validatedContent,
    rating: validatedRating,
    isAnonymous: Boolean(isAnonymous)
  };
};

// Comment-specific validations
const validateCommentData = (content, postId, parentId = null) => {
  const validatedContent = validateContent(content, 1, 1000);
  
  validateRequired(postId, 'Post ID');
  
  if (parentId) {
    validateRequired(parentId, 'Parent comment ID');
  }
  
  return {
    content: validatedContent,
    postId,
    parentId
  };
};

// File validation functions
const validateImageFile = (file) => {
  if (!file) return false;
  
  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new BadRequestError('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed');
  }
  
  // Check file extension
  const extension = file.originalname.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.test(extension)) {
    throw new BadRequestError('Invalid file extension. Only JPEG, JPG, PNG, GIF, WebP are allowed');
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError(`File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  return true;
};

const validateFeedbackFiles = (files) => {
  if (!files) return { valid: true, files: {} };
  
  const validatedFiles = {};
  let totalFiles = 0;
  
  // Validate avatar
  if (files.avatar && files.avatar.length > 0) {
    if (files.avatar.length > 1) {
      throw new BadRequestError('Only one avatar image is allowed');
    }
    validateImageFile(files.avatar[0]);
    validatedFiles.avatar = files.avatar;
    totalFiles += 1;
  }
  
  // Validate additional images
  if (files.images && files.images.length > 0) {
    if (files.images.length > 4) {
      throw new BadRequestError('Maximum 4 additional images are allowed');
    }
    
    files.images.forEach(file => validateImageFile(file));
    validatedFiles.images = files.images;
    totalFiles += files.images.length;
  }
  
  // Check total file count
  if (totalFiles > MAX_FILES_FEEDBACK) {
    throw new BadRequestError(`Maximum ${MAX_FILES_FEEDBACK} files are allowed (1 avatar + 4 images)`);
  }
  
  return { valid: true, files: validatedFiles };
};

const validatePostFiles = (files) => {
  if (!files || files.length === 0) {
    return { valid: true, files: [] };
  }
  
  if (files.length > MAX_FILES_POST) {
    throw new BadRequestError(`Maximum ${MAX_FILES_POST} files are allowed for posts`);
  }
  
  files.forEach(file => validateImageFile(file));
  
  return { valid: true, files };
};

const sanitizeFileName = (filename) => {
  // Remove potentially dangerous characters and normalize
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

const generateUniqueFileName = (originalName) => {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  const sanitized = sanitizeFileName(originalName.replace(/\.[^/.]+$/, ""));
  
  return `${timestamp}_${random}_${sanitized}.${extension}`;
};

module.exports = {
  validateRequired,
  validateString,
  validateNumber,
  validateEmail,
  validateRating,
  validatePagination,
  validateContent,
  validatePostData,
  validateFeedbackData,
  validateCommentData,
  // File validation
  validateImageFile,
  validateFeedbackFiles,
  validatePostFiles,
  sanitizeFileName,
  generateUniqueFileName,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_FEEDBACK,
  MAX_FILES_POST
};
