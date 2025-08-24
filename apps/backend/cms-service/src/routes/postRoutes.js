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

const searchSchema = {
    query: {
        query: { type: 'string', minLength: 2 },
        limit: { type: 'number', optional: true, min: 1, max: 100 },
        offset: { type: 'number', optional: true, min: 0 }
    }
};

const paginationSchema = {
    query: {
        limit: { type: 'number', optional: true, min: 1, max: 100 },
        offset: { type: 'number', optional: true, min: 0 }
    }
};


// ===================== PUBLIC ROUTES =====================

// Search posts
router.get('/search',
    validateRequest(searchSchema),
    postController.searchPosts
);


// Get a single post by slug
router.get('/:slug', postController.getPostBySlug);

// get all posts
router.get('/', validateRequest(paginationSchema), postController.getAllPosts);

// Apply authentication middleware to all routes below
router.use(authenticationMiddleware);

// ===================== PROTECTED ROUTES =====================

// Create a new post
router.post(
    '/',
    upload.array('media', 10), // Cho phép upload tối đa 10 file với key là 'media'
    validateRequest(postSchema),
    postController.createPost
);

// updatePost
router.put('/:postId',
    validateRequest(updatePostSchema),
    postController.updatePost
);

// deletePost
router.delete('/:postId',
    postController.deletePost
);


module.exports = router;