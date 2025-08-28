// src/repositories/tagRepository.js
const { BadRequestError } = require('common/core/error.response');
const { RepositoryHelper } = require('common/utils/repositoryHelper');

const createTagRepository = (supabase) => {
    const helper = new RepositoryHelper('tags');
    
    return {
        // Create new tag
        create: async (tagData) => {
            const { data, error } = await supabase
                .from('tags')
                .insert([tagData])
                .select()
                .single();
            
            if (error) {
                helper.logError('Database error creating tag', { error: error.message });
                if (error.code === '23505') { // Unique violation
                    throw new BadRequestError('Tag already exists.');
                }
                throw new BadRequestError('Failed to create tag.');
            }
            helper.logInfo('Tag created successfully', { tagId: data.id });
            return data;
        },

        // Find tag by slug
        findBySlug: async (slug) => {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('slug', slug)
                .is('deleted_at', null)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Database error finding tag by slug:', error);
                throw new BadRequestError('Failed to find tag.');
            }
            return data;
        },

        // Find tag by ID
        findById: async (id) => {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('id', id)
                .is('deleted_at', null)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Database error finding tag by ID:', error);
                throw new BadRequestError('Failed to find tag.');
            }
            return data;
        },

        // Get all tags with filters
        findAll: async (filters = {}) => {
            let query = supabase
                .from('tags')
                .select('*')
                .is('deleted_at', null)
                .order('posts_count', { ascending: false });

            // Apply filters
            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;
            
            if (error) {
                console.error('Database error finding tags:', error);
                throw new BadRequestError('Failed to retrieve tags.');
            }
            return data;
        },

        // Update tag
        update: async (id, updateData) => {
            const { data, error } = await supabase
                .from('tags')
                .update(updateData)
                .eq('id', id)
                .is('deleted_at', null)
                .select()
                .single();
            
            if (error) {
                console.error('Database error updating tag:', error);
                throw new BadRequestError('Failed to update tag.');
            }
            return data;
        },

        // Update posts count for a tag
        updatePostsCount: async (tagId, increment = 1) => {
            const { data, error } = await supabase
                .rpc('increment_tag_posts_count', {
                    tag_id: tagId,
                    increment_by: increment
                });
            
            if (error) {
                console.error('Database error updating posts count:', error);
                // Don't throw error, it's not critical
                console.warn('Failed to update tag posts count');
            }
            return data;
        },

        // Soft delete tag
        softDelete: async (id) => {
            const { data, error } = await supabase
                .from('tags')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('Database error soft deleting tag:', error);
                throw new BadRequestError('Failed to delete tag.');
            }
            return data;
        },

        // Restore soft deleted tag
        restore: async (id) => {
            const { data, error } = await supabase
                .from('tags')
                .update({ deleted_at: null })
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('Database error restoring tag:', error);
                throw new BadRequestError('Failed to restore tag.');
            }
            return data;
        },

        // Get popular tags
        getPopular: async (limit = 10) => {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .is('deleted_at', null)
                .gt('posts_count', 0)
                .order('posts_count', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('Database error getting popular tags:', error);
                throw new BadRequestError('Failed to retrieve popular tags.');
            }
            return data;
        }
    };
};

module.exports = { createTagRepository };
