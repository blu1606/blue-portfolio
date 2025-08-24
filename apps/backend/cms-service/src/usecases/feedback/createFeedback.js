// src/usecases/createFeedback.js
const { BadRequestError } = require('common/core/error.response');

const createCreateFeedbackUseCase = (feedbackRepository) => {
    return async (userId, content) => {
        if (!content || content.trim().length === 0) {
            throw new BadRequestError('Feedback content cannot be empty.');
        }

        const feedbackData = {
            user_id: userId,
            content,
            is_approved: false, // Mặc định phải được duyệt
            created_at: new Date().toISOString()
        };
        
        const newFeedback = await feedbackRepository.create(feedbackData);
        
        return {
            id: newFeedback.id,
            message: 'Feedback submitted successfully! It will be reviewed by an administrator.'
        };
    };
};

module.exports = { createCreateFeedbackUseCase };