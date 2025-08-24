// src/routes/commentRoutes.js
const express = require('express');
const { setupContainer } = require('../bootstrap');
const { createCommentController } = require('../controllers/commentController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { validateRequest } = require('common/middlewares/validationMiddleware');

const router = express.Router({ mergeParams: true }); // Dùng mergeParams để truy cập params từ router cha
const container = setupContainer();
const commentController = createCommentController(container);

const commentSchema = {
    body: {
        content: { type: 'string', minLength: 1, maxLength: 1000 },
        parentId: { type: 'string', optional: true }
    }
};

// ===================== PUBLIC ROUTES =====================
router.get('/', commentController.getCommentsByPost);

// ===================== PROTECTED ROUTES (cho users) =====================
router.use(authenticationMiddleware);
router.post('/', validateRequest(commentSchema), commentController.createComment);

// ===================== PROTECTED ROUTES (cho author và admin) =====================
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;