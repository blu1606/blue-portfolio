// src/usecases/getFeedbacks.js
const createGetFeedbacksUseCase = (feedbackRepository) => {
    return async () => {
        const feedbacks = await feedbackRepository.getApproved();
        return {
            feedbacks,
            total: feedbacks.length
        };
    };
};

module.exports = { createGetFeedbacksUseCase };