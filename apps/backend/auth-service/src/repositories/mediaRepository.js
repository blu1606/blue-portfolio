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
                    .update({
                        ...mediaData,
                        updated_at: new Date().toISOString()
                    })
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

        // Delete media record (soft delete)
        delete: async (id) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .update({ 
                        deleted_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id)
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error deleting media record');
                }

                RepositoryHelper.logInfo('Media record deleted successfully', { mediaId: id });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error deleting media record');
            }
        },

        // Get media by ID
        findById: async (id) => {
            try {
                const { data, error } = await supabase
                    .from('media')
                    .select('*')
                    .eq('id', id)
                    .is('deleted_at', null)
                    .single();
                
                if (error && error.code !== 'PGRST116') {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error finding media record');
                }

                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error finding media record');
            }
        },

        // Get user's media files
        getUserMedia: async (userId, entityType = null, limit = 10, offset = 0) => {
            try {
                let query = supabase
                    .from('media')
                    .select('*')
                    .eq('uploaded_by', userId)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (entityType) {
                    query = query.eq('entity_type', entityType);
                }

                const { data, error } = await query;
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error getting user media');
                }

                RepositoryHelper.logInfo('User media retrieved successfully', { 
                    userId, 
                    entityType, 
                    count: data.length 
                });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error getting user media');
            }
        }
    };
};

module.exports = { createMediaRepository };
