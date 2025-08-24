// src/routes/postRoutes.js
const express = require('express');
const { setupContainer } = require('../bootstrap');
const { createPostController } = require('../controllers/postController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { validateRequest } = require('common/middlewares/validationMiddleware');

const router = express.Router();
const container = setupContainer();
const postController = createPostController(container);

// Define validation schema
const postSchema = {
    body: {
        title: { type: 'string', minLength: 5, maxLength: 255 },
        content: { type: 'string', minLength: 10 },
    }
};

// Public route to get a post by slug
router.get('/:slug', postController.getPostBySlug);

// Apply authentication middleware to all routes below
router.use(authenticationMiddleware);

// ===================== PROTECTED ROUTES =====================

// Create a new post
router.post('/',
    validateRequest(postSchema),
    postController.createPost
);

// TODO: Add routes for update, delete, get all posts
// router.put('/:id', ...)
// router.delete('/:id', ...)
// router.get('/', ...)

module.exports = router;