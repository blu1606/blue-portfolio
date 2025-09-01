// src/routes/commentRoutes.js
const express = require('express');
const { setupContainer } = require('../bootstrap');
const { createCommentController } = require('../controllers/commentController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { commentSanitizer } = require('../middlewares/inputSanitizer');
const { validateCreateComment } = require('../middlewares/validationSchemas');

const router = express.Router({ mergeParams: true });
const container = setupContainer();
const commentController = createCommentController(container);

// ===================== PUBLIC ROUTES =====================

// Get comments by post
router.get('/', commentController.getCommentsByPost);

// ===================== PROTECTED ROUTES =====================

router.use(authenticationMiddleware);

// Create comment
router.post(
  '/', 
  commentSanitizer,
  validateCreateComment,
  commentController.createComment
);

// Delete comment (author or admin only)
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;