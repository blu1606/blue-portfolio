// src/utils/fileValidation.js

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_POST = 5;

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg'
];

/**
 * Validate if file is an allowed image type
 * @param {Object} file - Multer file object
 * @throws {Error} If file type is not allowed
 */
const validateImageFile = (file) => {
  if (!file) {
    const error = new Error('No file provided');
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    const error = new Error(`Only image files are allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Validate if file is an allowed video type
 * @param {Object} file - Multer file object
 * @throws {Error} If file type is not allowed
 */
const validateVideoFile = (file) => {
  if (!file) {
    const error = new Error('No file provided');
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    const error = new Error(`Only video files are allowed. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Validate if file is an allowed media type (image or video)
 * @param {Object} file - Multer file object
 * @throws {Error} If file type is not allowed
 */
const validateMediaFile = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  
  if (!allAllowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allAllowedTypes.join(', ')}`);
  }
};

module.exports = {
  MAX_FILE_SIZE,
  MAX_FILES_POST,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  validateImageFile,
  validateVideoFile,
  validateMediaFile
};
