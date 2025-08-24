// src/repositories/feedbackRepository.js
const { BadRequestError } = require('common/core/error.response');

const createFeedbackRepository = (supabase) => {
    return {
        create: async (feedbackData) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .insert([feedbackData])
                .select()
                .single();
            
            if (error) {
                console.error('Database error creating feedback:', error);
                throw new BadRequestError('Failed to create feedback.');
            }
            return data;
        },

        getApproved: async () => {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('id, user_id, content, created_at')
                .eq('is_approved', true)
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('Database error getting approved feedbacks:', error);
                throw new BadRequestError('Failed to retrieve feedbacks.');
            }
            return data;
        },

        getById: async (feedbackId) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*')
                .eq('id', feedbackId)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Database error getting feedback by ID:', error);
                throw new BadRequestError('Failed to retrieve feedback.');
            }
            return data;
        },

        approve: async (feedbackId) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .update({ is_approved: true })
                .eq('id', feedbackId)
                .select()
                .single();
                
            if (error) {
                console.error('Database error approving feedback:', error);
                throw new BadRequestError('Failed to approve feedback.');
            }
            return data;
        },

        getAll: async () => {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('Database error getting all feedbacks:', error);
                throw new BadRequestError('Failed to retrieve all feedbacks.');
            }
            return data;
        }

    };
};

module.exports = { createFeedbackRepository };