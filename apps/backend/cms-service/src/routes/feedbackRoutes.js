// src/routes/feedbackRoutes.js
const express = require('express');
const { setupContainer } = require('../bootstrap');
const { createFeedbackController } = require('../controllers/feedbackController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { validateRequest } = require('common/middlewares/validationMiddleware');

const router = express.Router();
const container = setupContainer();
const feedbackController = createFeedbackController(container);

const feedbackSchema = {
    body: {
        content: { type: 'string', minLength: 10, maxLength: 500 }
    }
};

// ===================== PUBLIC ROUTES =====================
router.get('/', feedbackController.getApprovedFeedbacks);

// ===================== PROTECTED ROUTES (cho users) =====================
router.use(authenticationMiddleware);
router.post('/', validateRequest(feedbackSchema), feedbackController.createFeedback);

// ===================== ADMIN ROUTES =====================
// Áp dụng middleware phân quyền cho các route admin
router.use(authorize('admin'));

// Lấy tất cả feedback cho admin
router.get('/admin', feedbackController.getAllFeedbacksForAdmin);

// Phê duyệt một feedback
router.put('/:feedbackId/approve', feedbackController.approveFeedback);

module.exports = router;