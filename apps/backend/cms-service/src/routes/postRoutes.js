// src/routes/postRoutes.js
const express = require('express');
const { setupContainer } = require('../bootstrap');
const { createPostController } = require('../controllers/postController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { postUpload } = require('../utils/multer');
const { postSanitizer } = require('../middlewares/inputSanitizer');
const { 
  validateCreatePost, 
  validateUpdatePost, 
  validatePagination,
  validateSearch 
} = require('../middlewares/validationSchemas');

const router = express.Router();
const container = setupContainer();
const postController = createPostController(container);

// ===================== PUBLIC ROUTES =====================

// Get all posts with pagination
router.get('/', validatePagination, postController.getAllPosts);

// Search posts
router.get('/search', validateSearch, postController.searchPosts);

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
    // postUpload,
    // postSanitizer,
    // validateCreatePost,
    postController.createPost
);

// Update post
router.put(
    '/:postId',
    // postUpload,
    // postSanitizer,
    validateUpdatePost,
    postController.updatePost
);

// Delete post
router.delete('/:postId', postController.deletePost);


module.exports = router;