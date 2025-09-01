// src/utils/multer.js
const multer = require('multer');

// File size limits
const MAX_AVATAR_SIZE = 10 * 1024 * 1024; // 10MB

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration for avatar upload
const avatarUpload = multer({
  storage: multer.memoryStorage(), // Store in memory for Cloudinary upload
  fileFilter,
  limits: {
    fileSize: MAX_AVATAR_SIZE,
    files: 1
  }
});

module.exports = {
  avatarUpload: avatarUpload.single('avatar')
};
