// src/usecases/approveFeedback.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');

const createApproveFeedbackUseCase = (feedbackRepository) => {
    return async (feedbackId) => {
        if (!feedbackId) {
            throw new BadRequestError('Feedback ID is required.');
        }

        const existingFeedback = await feedbackRepository.getById(feedbackId);
        if (!existingFeedback) {
            throw new NotFoundError('Feedback not found.');
        }

        if (existingFeedback.is_approved) {
            return {
                message: 'Feedback is already approved.'
            };
        }

        await feedbackRepository.approve(feedbackId);

        return {
            message: 'Feedback approved successfully!'
        };
    };
};

module.exports = { createApproveFeedbackUseCase };