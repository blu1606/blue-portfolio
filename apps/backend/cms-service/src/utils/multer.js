// src/utils/multer.js
const multer = require('multer');
const { validateImageFile, MAX_FILE_SIZE, MAX_FILES_POST } = require('./fileValidation');

/**
 * Consolidated multer configuration for all file uploads
 */

const storage = multer.memoryStorage();

// General file filter for posts
const postFileFilter = (req, file, cb) => {
  try {
    validateImageFile(file);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Feedback-specific file filter
const feedbackFileFilter = (req, file, cb) => {
  try {
    validateImageFile(file);
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Post upload configuration
const postUpload = multer({
  storage: storage,
  fileFilter: postFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_POST
  }
});

// Feedback upload configuration
const feedbackUpload = multer({
  storage: storage,
  fileFilter: feedbackFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // 1 avatar + 4 images
  }
});

// Field configurations
const feedbackUploadFields = feedbackUpload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'images', maxCount: 4 }
]);

module.exports = {
  postUpload: postUpload.array('files', MAX_FILES_POST),
  feedbackUpload,
  feedbackUploadFields
};