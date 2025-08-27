// src/repositories/mediaRepository.js
const { BadRequestError } = require('common/core/error.response');

const createMediaRepository = (supabase) => {
    return {
        // Create new media record
        create: async (mediaData) => {
            const { data, error } = await supabase
                .from('media')
                .insert([mediaData])
                .select()
                .single();
            
            if (error) {
                console.error('Database error creating media:', error);
                throw new BadRequestError('Failed to create media record.');
            }
            return data;
        },

        // Update media record
        update: async (id, mediaData) => {
            const { data, error } = await supabase
                .from('media')
                .update(mediaData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('Database error updating media:', error);
                throw new BadRequestError('Failed to update media record.');
            }
            return data;
        },

        // Get user's current avatar
        getUserAvatar: async (userId) => {
            const { data, error } = await supabase
                .from('media')
                .select('*')
                .eq('entity_type', 'user_avatar')
                .eq('uploaded_by', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                console.error('Database error getting user avatar:', error);
                return null; // Return null instead of throwing error
            }
            return data;
        },

        // Update entity_id for media records (link media to feedback/post)
        updateEntityId: async (entityType, entityId, url) => {
            const { data, error } = await supabase
                .from('media')
                .update({ entity_id: entityId })
                .eq('entity_type', entityType)
                .eq('url', url)
                .select();
            
            if (error) {
                console.error('Database error updating entity_id:', error);
                // Don't throw error here, it's not critical
                console.warn('Failed to link media to entity, but continuing...');
            }
            return data;
        },

        // Legacy method for post media
        findByPostId: async (postId) => {
            const { data, error } = await supabase
                .from('media')
                .select('*')
                .eq('entity_type', 'post')
                .eq('entity_id', postId);

            if (error) {
                console.error('Database error finding media:', error);
                throw new BadRequestError('Failed to retrieve media for post.');
            }
            return data;
        },

        // Get media by entity
        getByEntity: async (entityType, entityId) => {
            const { data, error } = await supabase
                .from('media')
                .select('*')
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('Database error getting media by entity:', error);
                throw new BadRequestError('Failed to retrieve media.');
            }
            return data;
        },

        // Hard delete media record (for cleanup)
        deleteById: async (id) => {
            const { data, error } = await supabase
                .from('media')
                .delete()
                .eq('id', id)
                .select()
                .single();
                
            if (error) {
                console.error('Database error deleting media:', error);
                throw new BadRequestError('Failed to delete media.');
            }
            return data;
        },

        // Soft delete media record  
        softDelete: async (id) => {
            const { data, error } = await supabase
                .from('media')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
                
            if (error) {
                console.error('Database error soft deleting media:', error);
                throw new BadRequestError('Failed to soft delete media.');
            }
            return data;
        },

        // Restore soft deleted media
        restore: async (id) => {
            const { data, error } = await supabase
                .from('media')
                .update({ deleted_at: null })
                .eq('id', id)
                .select()
                .single();
                
            if (error) {
                console.error('Database error restoring media:', error);
                throw new BadRequestError('Failed to restore media.');
            }
            return data;
        },

        // Remove by cloudinary public ID
        removeByPublicId: async (publicId) => {
            const { error } = await supabase
                .from('media')
                .update({ deleted_at: new Date().toISOString() })
                .eq('cloudinary_public_id', publicId);
                
            if (error) {
                console.error('Database error deleting media:', error);
                throw new BadRequestError('Failed to delete media entry.');
            }
            return { success: true };
        }
    };
};

module.exports = { createMediaRepository };