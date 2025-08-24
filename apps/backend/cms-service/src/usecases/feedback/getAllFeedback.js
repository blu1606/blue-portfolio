// src/usecases/getAllFeedbacks.js
const createGetAllFeedbacksUseCase = (feedbackRepository) => {
    return async () => {
        const feedbacks = await feedbackRepository.getAll();
        return {
            feedbacks,
            total: feedbacks.length
        };
    };
};

module.exports = { createGetAllFeedbacksUseCase };