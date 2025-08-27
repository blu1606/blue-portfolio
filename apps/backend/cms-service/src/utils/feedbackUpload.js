// src/utils/feedbackUpload.js
const multer = require('multer');
const path = require('path');

// Configure multer specifically for feedback uploads
const storage = multer.memoryStorage();

const feedbackFileFilter = (req, file, cb) => {
  // Allow only images for feedback
  if (file.mimetype.startsWith('image/')) {
    // Check file types
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed for feedback'), false);
    }
  } else {
    cb(new Error('Only image files are allowed for feedback'), false);
  }
};

const feedbackUpload = multer({
  storage: storage,
  fileFilter: feedbackFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files (1 avatar + 4 additional images)
  }
});

// Field configuration
const feedbackUploadFields = feedbackUpload.fields([
  { name: 'avatar', maxCount: 1 }, // User avatar
  { name: 'images', maxCount: 4 }  // Additional feedback images
]);

module.exports = {
  feedbackUpload,
  feedbackUploadFields
};
