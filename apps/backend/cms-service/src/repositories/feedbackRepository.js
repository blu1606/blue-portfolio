// src/repositories/feedbackRepository.js
const { BadRequestError } = require('common/core/error.response');
const { RepositoryHelper } = require('common/utils/repositoryHelper');

const createFeedbackRepository = (supabase) => {
    const helper = new RepositoryHelper('feedbacks');
    
    return {
        create: async (feedbackData) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .insert([feedbackData])
                .select()
                .single();
            
            if (error) {
                helper.logError('Database error creating feedback', { error: error.message });
                throw new BadRequestError('Failed to create feedback.');
            }
            helper.logInfo('Feedback created successfully', { feedbackId: data.id });
            return data;
        },

        // Check for duplicate feedback from same IP within time window
        checkDuplicateByIP: async (ipAddress, timeWindowMinutes = 30) => {
            const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString();
            
            const { data, error } = await supabase
                .from('feedbacks')
                .select('id')
                .eq('ip_address', ipAddress)
                .gte('created_at', timeThreshold)
                .limit(1);
            
            if (error) {
                helper.logError('Database error checking duplicate feedback', { 
                    ipAddress, 
                    timeWindowMinutes,
                    error: error.message 
                });
                return false;
            }
            
            return data && data.length > 0;
        },

        // Get feedback count by IP for rate limiting
        getFeedbackCountByIP: async (ipAddress, timeWindowHours = 24) => {
            const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString();
            
            const { count, error } = await supabase
                .from('feedbacks')
                .select('id', { count: 'exact' })
                .eq('ip_address', ipAddress)
                .gte('created_at', timeThreshold);
            
            if (error) {
                console.error('Database error counting feedback by IP:', error);
                return 0;
            }
            
            return count || 0;
        },

        getApproved: async (filters = {}) => {
            let query = supabase
                .from('feedbacks')
                .select(`
                    id, 
                    user_id, 
                    anonymous_name,
                    avatar_url,
                    content, 
                    rating,
                    created_at
                `)
                .eq('is_approved', true)
                .is('deleted_at', null);

            // Apply filters
            if (filters.rating) {
                query = query.eq('rating', filters.rating);
            }

            if (filters.hasRating) {
                query = query.not('rating', 'is', null);
            }

            // Apply sorting
            if (filters.sortBy === 'rating') {
                query = query.order('rating', { ascending: false });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
                
            const { data, error } = await query;
                
            if (error) {
                console.error('Database error getting approved feedbacks:', error);
                throw new BadRequestError('Failed to retrieve feedbacks.');
            }
            return data;
        },

        getById: async (feedbackId, includeDeleted = false) => {
            let query = supabase
                .from('feedbacks')
                .select('*')
                .eq('id', feedbackId);

            if (!includeDeleted) {
                query = query.is('deleted_at', null);
            }

            const { data, error } = await query.single();
            
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

        getAll: async (filters = {}) => {
            let query = supabase
                .from('feedbacks')
                .select('*')
                .is('deleted_at', null);

            // Apply filters
            if (filters.approved !== undefined) {
                query = query.eq('is_approved', filters.approved);
            }

            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }

            if (filters.rating) {
                query = query.eq('rating', filters.rating);
            }

            // Apply sorting
            query = query.order('created_at', { ascending: false });

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
            }
                
            const { data, error } = await query;
                
            if (error) {
                console.error('Database error getting all feedbacks:', error);
                throw new BadRequestError('Failed to retrieve all feedbacks.');
            }
            return data;
        },

        // New methods for enhanced functionality
        updateRating: async (feedbackId, rating) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .update({ rating })
                .eq('id', feedbackId)
                .is('deleted_at', null)
                .select()
                .single();
                
            if (error) {
                console.error('Database error updating feedback rating:', error);
                throw new BadRequestError('Failed to update feedback rating.');
            }
            return data;
        },

        updateContent: async (feedbackId, content) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('id', feedbackId)
                .is('deleted_at', null)
                .select()
                .single();
                
            if (error) {
                console.error('Database error updating feedback content:', error);
                throw new BadRequestError('Failed to update feedback content.');
            }
            return data;
        },

        softDelete: async (feedbackId) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', feedbackId)
                .select()
                .single();
                
            if (error) {
                console.error('Database error soft deleting feedback:', error);
                throw new BadRequestError('Failed to delete feedback.');
            }
            return data;
        },

        restore: async (feedbackId) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .update({ deleted_at: null })
                .eq('id', feedbackId)
                .select()
                .single();
                
            if (error) {
                console.error('Database error restoring feedback:', error);
                throw new BadRequestError('Failed to restore feedback.');
            }
            return data;
        },

        getByRating: async (rating, limit = 10) => {
            const { data, error } = await supabase
                .from('feedbacks')
                .select('id, content, anonymous_name, avatar_url, created_at')
                .eq('rating', rating)
                .eq('is_approved', true)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) {
                console.error('Database error getting feedbacks by rating:', error);
                throw new BadRequestError('Failed to retrieve feedbacks by rating.');
            }
            return data;
        },

        getStats: async () => {
            const { data, error } = await supabase
                .rpc('get_feedback_stats');
                
            if (error) {
                console.error('Database error getting feedback stats:', error);
                return {
                    total: 0,
                    approved: 0,
                    pending: 0,
                    averageRating: 0
                };
            }
            return data;
        }

    };
};

module.exports = { createFeedbackRepository };