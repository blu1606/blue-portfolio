// src/controllers/feedbackController.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const asyncHandler = require('common/helpers/asyncHandler');

const createFeedbackController = (container) => {
    return {
        // Anonymous feedback creation (no auth required)
        createAnonymousFeedback: asyncHandler(async (req, res) => {
            const { authorName, authorEmail, content, rating } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            
            // Input validation
            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: 'Content is required'
                });
            }

            if (!authorName || authorName.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Author name is required for anonymous feedback'
                });
            }

            if (authorName.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Author name must not exceed 100 characters'
                });
            }

            if (content.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Content must be at least 10 characters long'
                });
            }

            if (content.length > 2000) {
                return res.status(400).json({
                    success: false,
                    message: 'Content must not exceed 2000 characters'
                });
            }

            // Validate email if provided
            if (authorEmail && authorEmail.trim().length > 0) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(authorEmail)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please provide a valid email address'
                    });
                }
            }

            // Validate rating if provided
            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            try {
                const createFeedbackUseCase = container.resolve('createFeedbackUseCase');
                const feedbackData = {
                    userId: null,
                    authorName,
                    authorEmail,
                    content,
                    rating: rating ? parseInt(rating) : null,
                    isAnonymous: true
                };

                const result = await createFeedbackUseCase(
                    feedbackData, 
                    req.files || {}, 
                    ipAddress, 
                    userAgent
                );
                
                return res.status(201).json({
                    success: true,
                    message: result.message,
                    metadata: result.feedback
                });
            } catch (error) {
                if (error.statusCode === 400 || error.statusCode === 429) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error;
            }
        }),

        // Authenticated user feedback creation
        createFeedback: asyncHandler(async (req, res) => {
            const userId = req.user.id;
            const { content, rating } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            
            // Input validation
            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: 'Content is required'
                });
            }
            
            if (content.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Content must be at least 10 characters long'
                });
            }

            if (content.length > 2000) {
                return res.status(400).json({
                    success: false,
                    message: 'Content must not exceed 2000 characters'
                });
            }

            // Validate rating if provided
            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            try {
                const createFeedbackUseCase = container.resolve('createFeedbackUseCase');
                const feedbackData = {
                    userId,
                    authorName: null,
                    authorEmail: null,
                    content,
                    rating: rating ? parseInt(rating) : null,
                    isAnonymous: false
                };

                const result = await createFeedbackUseCase(
                    feedbackData, 
                    req.files || {}, 
                    ipAddress, 
                    userAgent
                );
                
                return res.status(201).json({
                    success: true,
                    message: result.message,
                    metadata: result.feedback
                });
            } catch (error) {
                if (error.statusCode === 400 || error.statusCode === 429) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error;
            }
        }),

        getApprovedFeedbacks: asyncHandler(async (req, res) => {
            const getFeedbacksUseCase = container.get('getFeedbacksUseCase');
            const result = await getFeedbacksUseCase();
            
            new SuccessResponse({
                message: 'Approved feedbacks retrieved successfully!',
                metadata: result
            }).send(res);
        }),
        
        approveFeedback: asyncHandler(async (req, res) => {
            const { feedbackId } = req.params;
            const approveFeedbackUseCase = container.get('approveFeedbackUseCase');
            const result = await approveFeedbackUseCase(feedbackId);

            new SuccessResponse({
                message: result.message
            }).send(res);
        }),

        getAllFeedbacksForAdmin: asyncHandler(async (req, res) => {
            const getAllFeedbacksUseCase = container.get('getAllFeedbacksUseCase');
            const result = await getAllFeedbacksUseCase();
            
            new SuccessResponse({
                message: 'All feedbacks retrieved successfully!',
                metadata: result
            }).send(res);
        }),
    };
};

module.exports = { createFeedbackController };
