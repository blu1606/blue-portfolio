// src/routes/feedbackRoutes.js
const express = require('express');
const { setupContainer } = require('../bootstrap');
const { createFeedbackController } = require('../controllers/feedbackController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { authorize } = require('common/middlewares/authorizationMiddleware');
const { feedbackUploadFields } = require('../utils/multer');
const { createSimpleLimiter } = require('../middlewares/rateLimiter');
const { feedbackSanitizer } = require('../middlewares/inputSanitizer');
const { 
  validateCreateFeedback, 
  validateCreateAnonymousFeedback 
} = require('../middlewares/validationSchemas');

const router = express.Router();
const container = setupContainer();
const feedbackController = createFeedbackController(container);

// ===================== PUBLIC ROUTES =====================

// Get approved feedbacks
router.get('/', feedbackController.getApprovedFeedbacks);

// Create anonymous feedback (no auth required)
router.post(
  '/anonymous', 
  feedbackUploadFields,
  feedbackSanitizer,
  validateCreateAnonymousFeedback,
  createSimpleLimiter({ windowMs: 1000, max: 3 }),
  feedbackController.createAnonymousFeedback
);

// ===================== PROTECTED ROUTES (for authenticated users) =====================

router.use(authenticationMiddleware);

// Create authenticated user feedback
router.post(
  '/', 
  feedbackUploadFields,
  feedbackSanitizer,
  validateCreateFeedback,
  feedbackController.createFeedback
);

// ===================== ADMIN ROUTES =====================

// Get all feedbacks for admin (requires authentication and admin role)
router.get('/admin', authenticationMiddleware, authorize('admin'), feedbackController.getAllFeedbacksForAdmin);

// Approve a feedback (requires authentication and admin role)
router.put('/:feedbackId/approve', authenticationMiddleware, authorize('admin'), feedbackController.approveFeedback);

module.exports = router;