// src/routes/feedbackRoutes.js
const express = require('express');
const { setupContainer } = require('../bootstrap');
const { createFeedbackController } = require('../controllers/feedbackController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { authorize } = require('common/middlewares/authorizationMiddleware');
const { feedbackUploadFields } = require('../utils/multer');
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

router.use(authorize('admin'));

// Get all feedbacks for admin
router.get('/admin', feedbackController.getAllFeedbacksForAdmin);

// Approve a feedback
router.put('/:feedbackId/approve', feedbackController.approveFeedback);

module.exports = router;