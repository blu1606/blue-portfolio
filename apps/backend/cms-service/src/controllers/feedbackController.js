// src/controllers/feedbackController.js
const asyncHandler = require('common/helpers/asyncHandler');
const { ResponseHelper } = require('../utils/responseHelper');
const { validateFeedbackData } = require('../utils/validation');
const { validateFeedbackFiles } = require('../utils/fileValidation');

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
                
                const createFeedbackUseCase = container.resolve('createFeedbackUseCase');
                const result = await createFeedbackUseCase(
                    { ...feedbackData, userId: null }, 
                    files, 
                    ipAddress, 
                    userAgent
                );
                
                return ResponseHelper.created(res, result.message, result.feedback);
            } catch (error) {
                return ResponseHelper.handleError(res, error);
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
                
                const createFeedbackUseCase = container.resolve('createFeedbackUseCase');
                const result = await createFeedbackUseCase(
                    { ...feedbackData, userId, authorName: null, authorEmail: null }, 
                    files, 
                    ipAddress, 
                    userAgent
                );
                
                return ResponseHelper.created(res, result.message, result.feedback);
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        getApprovedFeedbacks: asyncHandler(async (req, res) => {
            try {
                const getFeedbacksUseCase = container.get('getFeedbacksUseCase');
                const result = await getFeedbacksUseCase();
                
                return ResponseHelper.success(res, 'Approved feedbacks retrieved successfully!', result);
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),
        
        approveFeedback: asyncHandler(async (req, res) => {
            try {
                const { feedbackId } = req.params;
                const approveFeedbackUseCase = container.get('approveFeedbackUseCase');
                const result = await approveFeedbackUseCase(feedbackId);

                return ResponseHelper.success(res, result.message);
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        getAllFeedbacksForAdmin: asyncHandler(async (req, res) => {
            try {
                const getAllFeedbacksUseCase = container.get('getAllFeedbacksUseCase');
                const result = await getAllFeedbacksUseCase();
                
                return ResponseHelper.success(res, 'All feedbacks retrieved successfully!', result);
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),


    };
};

module.exports = { createFeedbackController };