// src/repositories/mediaRepository.js
const { BadRequestError } = require('common/core/error.response');
const { RepositoryHelper } = require('common/utils/repositoryHelper');

const createMediaRepository = (supabase) => {
    return {
        // Create new media record
        create: async (mediaData) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .insert([mediaData])
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error creating media record');
                }

                RepositoryHelper.logInfo('Media record created successfully', { mediaId: data.id });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error creating media record');
            }
        },

        // Update media record
        update: async (id, mediaData) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .update(mediaData)
                    .eq('id', id)
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error updating media record');
                }

                RepositoryHelper.logInfo('Media record updated successfully', { mediaId: id });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error updating media record');
            }
        },

        // Get user's current avatar
        getUserAvatar: async (userId) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .select('*')
                    .eq('entity_type', 'user_avatar')
                    .eq('uploaded_by', userId)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                    RepositoryHelper.logError('Error getting user avatar', error, { userId });
                    return null; // Return null instead of throwing error
                }

                if (data) {
                    RepositoryHelper.logInfo('User avatar retrieved successfully', { userId });
                }
                return data;
            } catch (error) {
                RepositoryHelper.logError('Error getting user avatar', error, { userId });
                return null;
            }
        },

        // Update entity_id for media records (link media to feedback/post)
        updateEntityId: async (entityType, entityId, url) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .update({ entity_id: entityId })
                    .eq('entity_type', entityType)
                    .eq('url', url)
                    .select();
                
                if (error) {
                    RepositoryHelper.logError('Error updating entity_id', error, { entityType, entityId, url });
                    // Don't throw error here, it's not critical
                    RepositoryHelper.logInfo('Failed to link media to entity, but continuing...', { entityType, entityId });
                }

                if (data && data.length > 0) {
                    RepositoryHelper.logInfo('Media entity_id updated successfully', { entityType, entityId, count: data.length });
                }
                return data;
            } catch (error) {
                RepositoryHelper.logError('Error updating entity_id', error, { entityType, entityId, url });
                return null;
            }
        },

        // Legacy method for post media
        findByPostId: async (postId) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .select('*')
                    .eq('entity_type', 'post')
                    .eq('entity_id', postId)
                    .is('deleted_at', null);

                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving media for post');
                }

                RepositoryHelper.logInfo('Media retrieved for post successfully', { postId, count: data.length });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving media for post');
            }
        },

        // Get media by entity
        getByEntity: async (entityType, entityId) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .select('*')
                    .eq('entity_type', entityType)
                    .eq('entity_id', entityId)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });
                    
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving media by entity');
                }

                RepositoryHelper.logInfo('Media retrieved by entity successfully', { 
                    entityType, 
                    entityId, 
                    count: data.length 
                });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving media by entity');
            }
        },

        // Hard delete media record (for cleanup)
        deleteById: async (id) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .delete()
                    .eq('id', id)
                    .select()
                    .single();
                    
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error deleting media');
                }

                RepositoryHelper.logInfo('Media deleted successfully', { mediaId: id });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error deleting media');
            }
        },

        // Soft delete media record  
        softDelete: async (id) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', id)
                    .select()
                    .single();
                    
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error soft deleting media');
                }

                RepositoryHelper.logInfo('Media soft deleted successfully', { mediaId: id });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error soft deleting media');
            }
        },

        // Restore soft deleted media
        restore: async (id) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .update({ deleted_at: null })
                    .eq('id', id)
                    .select()
                    .single();
                    
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error restoring media');
                }

                RepositoryHelper.logInfo('Media restored successfully', { mediaId: id });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error restoring media');
            }
        },

        // Remove by cloudinary public ID
        removeByPublicId: async (publicId) => {
            try {
                const { error } = await supabase
                    .from('media')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('cloudinary_public_id', publicId);
                    
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error deleting media by public ID');
                }

                RepositoryHelper.logInfo('Media deleted by public ID successfully', { publicId });
                return { success: true };
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error deleting media by public ID');
            }
        }
    };
};

module.exports = { createMediaRepository };