// src/controllers/feedbackController.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const asyncHandler = require('common/helpers/asyncHandler');

const createFeedbackController = (container) => {
    return {
        createFeedback: asyncHandler(async (req, res) => {
            const userId = req.user.id;
            const { content } = req.body;
            
            const createFeedbackUseCase = container.get('createFeedbackUseCase');
            const result = await createFeedbackUseCase(userId, content);
            
            new CREATED({
                message: result.message,
                metadata: { id: result.id }
            }).send(res);
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