// src/utils/fileValidation.js
const { BadRequestError } = require('common/core/error.response');

/**
 * File Upload Validation Utilities
 * Centralized file validation logic
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = /jpeg|jpg|png|gif|webp/;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_FEEDBACK = 5; // 1 avatar + 4 images
const MAX_FILES_POST = 10;

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
