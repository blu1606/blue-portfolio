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
            const getFeedbacksUseCase = container.get('getFeedbacksUseCase');
            // Cần một hàm repository mới để lấy cả feedback chưa duyệt
            // Ví dụ: const feedbacks = await feedbackRepository.getAll();
            
            // Giả định bạn đã có hàm đó, tôi sẽ mô phỏng nó ở đây.
            const allFeedbacks = await container.get('feedbackRepository').getAll();
            
            new SuccessResponse({
                message: 'All feedbacks retrieved successfully!',
                metadata: { feedbacks: allFeedbacks }
            }).send(res);
        }),

    };
};

module.exports = { createFeedbackController };