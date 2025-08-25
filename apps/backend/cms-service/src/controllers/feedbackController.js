// src/controllers/feedbackController.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const asyncHandler = require('common/helpers/asyncHandler');

const createFeedbackController = (container) => {
    return {
        createFeedback: asyncHandler(async (req, res) => {
            const userId = req.user.id;
            const { content } = req.body;
            
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
            
            if (content.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Content must not exceed 1000 characters'
                });
            }
            
            // Sanitize content to prevent XSS while preserving special characters
            const sanitizedContent = content
                .replace(/<script[^>]*>.*?<\/script>/gi, '')
                .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
                .replace(/<object[^>]*>.*?<\/object>/gi, '');
            
            try {
                const createFeedbackUseCase = container.resolve('createFeedbackUseCase');
                const result = await createFeedbackUseCase(userId, sanitizedContent);
                
                return res.status(201).json({
                    success: true,
                    message: result.message,
                    metadata: result.feedback
                });
            } catch (error) {
                if (error.statusCode === 400) {
                    return res.status(400).json({
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