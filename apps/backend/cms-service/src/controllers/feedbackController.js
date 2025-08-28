// src/controllers/feedbackController.js
const asyncHandler = require('common/helpers/asyncHandler');
const { SuccessResponse, CREATED } = require('common/core/success.response');
const { validateFeedbackData, validateFeedbackFiles } = require('../utils/validation');

// Simple error handler
const handleError = (res, error) => {
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message
        });
    }
    
    console.error('Unhandled error:', error);
    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
};

const createFeedbackController = (container) => {
    return {
        // Anonymous feedback creation (no auth required)
        createAnonymousFeedback: asyncHandler(async (req, res) => {
            try {
                const ipAddress = req.ip || req.connection.remoteAddress;
                const userAgent = req.get('User-Agent');
                
                // Validate input data
                const feedbackData = validateFeedbackData({ ...req.body, isAnonymous: true });
                
                // Validate files
                const { files } = validateFeedbackFiles(req.files);
                
                const createFeedbackUseCase = container.get('createFeedbackUseCase');
                const result = await createFeedbackUseCase(
                    { ...feedbackData, userId: null }, 
                    files, 
                    ipAddress, 
                    userAgent
                );
                
                return new CREATED({
                    message: result.message,
                    metadata: result.feedback
                }).send(res);
            } catch (error) {
                return handleError(res, error);
            }
        }),

        // Authenticated user feedback creation
        createFeedback: asyncHandler(async (req, res) => {
            try {
                const userId = req.user.id;
                const ipAddress = req.ip || req.connection.remoteAddress;
                const userAgent = req.get('User-Agent');
                
                // Validate input data
                const feedbackData = validateFeedbackData({ ...req.body, isAnonymous: false });
                
                // Validate files
                const { files } = validateFeedbackFiles(req.files);
                
                const createFeedbackUseCase = container.get('createFeedbackUseCase');
                const result = await createFeedbackUseCase(
                    { ...feedbackData, userId, authorName: null, authorEmail: null }, 
                    files, 
                    ipAddress, 
                    userAgent
                );
                
                return new CREATED({
                    message: result.message,
                    metadata: result.feedback
                }).send(res);
            } catch (error) {
                return handleError(res, error);
            }
        }),

        getApprovedFeedbacks: asyncHandler(async (req, res) => {
            try {
                const getFeedbacksUseCase = container.get('getFeedbacksUseCase');
                const result = await getFeedbacksUseCase();
                
                return new SuccessResponse({
                    message: 'Approved feedbacks retrieved successfully!',
                    metadata: result
                }).send(res);
            } catch (error) {
                return handleError(res, error);
            }
        }),
        
        approveFeedback: asyncHandler(async (req, res) => {
            try {
                const { feedbackId } = req.params;
                const approveFeedbackUseCase = container.get('approveFeedbackUseCase');
                const result = await approveFeedbackUseCase(feedbackId);

                return new SuccessResponse({
                    message: result.message
                }).send(res);
            } catch (error) {
                return handleError(res, error);
            }
        }),

        getAllFeedbacksForAdmin: asyncHandler(async (req, res) => {
            try {
                const getAllFeedbacksUseCase = container.get('getAllFeedbacksUseCase');
                const result = await getAllFeedbacksUseCase();
                
                return new SuccessResponse({
                    message: 'All feedbacks retrieved successfully!',
                    metadata: result
                }).send(res);
            } catch (error) {
                return handleError(res, error);
            }
        }),


    };
};

module.exports = { createFeedbackController };