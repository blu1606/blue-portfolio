// src/routes/postRoutes.js
const express = require('express');
const multer = require('multer');
const { setupContainer } = require('../bootstrap');
const { createPostController } = require('../controllers/postController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { postSanitizer, inputSanitizer } = require('../middlewares/inputSanitizer');
const { 
  validateCreatePost, 
  validateUpdatePost, 
  validateDeletePost,
  validatePagination,
  validateSearch 
} = require('../middlewares/validationSchemas');

const router = express.Router();
const container = setupContainer();
const postController = createPostController(container);

// Simple multer configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Conditional multer middleware - only apply to multipart requests
const conditionalUpload = (req, res, next) => {
    if (req.is('multipart/form-data')) {
        return upload.array('media', 5)(req, res, next);
    }
    next();
};

// ===================== PUBLIC ROUTES =====================

// Get all posts with pagination
router.get('/', validatePagination, postController.getAllPosts);

// Search posts - sanitize query parameters to prevent XSS in search queries
router.get('/search', inputSanitizer({ sanitizeBody: false, sanitizeParams: false }), validateSearch, postController.searchPosts);

// Get post by slug
router.get('/slug/:slug', postController.getPostBySlug);

// Get post by ID
router.get('/:postId', postController.getPostById);

// ===================== PROTECTED ROUTES =====================

// Apply authentication middleware to all routes below
router.use(authenticationMiddleware);

// Create a new post
router.post(
    '/',
    conditionalUpload,
    postSanitizer,
    validateCreatePost,
    postController.createPost
);

// Update post
router.put(
    '/:postId',
    conditionalUpload,
    postSanitizer,
    validateUpdatePost,
    postController.updatePost
);

// Delete post
router.delete('/:postId', validateDeletePost, postController.deletePost);


module.exports = router;