// src/repositories/commentRepository.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');
const { RepositoryHelper } = require('common/utils/repositoryHelper');

const createCommentRepository = (supabase) => {
    return {
        /**
         * Tạo một bình luận mới
         * @param {Object} commentData - Dữ liệu bình luận
         * @returns {Object} - Bình luận đã được tạo
         */
        create: async (commentData) => {
            try {
                const { data, error } = await supabase
                    .from('comments')
                    .insert([commentData])
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error creating comment');
                }

                RepositoryHelper.logInfo('Comment created successfully', { commentId: data.id });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error creating comment');
            }
        },

        /**
         * Lấy tất cả bình luận của một bài viết
         * @param {string} postId - ID của bài viết
         * @param {Object} filters - Bộ lọc
         * @returns {Array} - Danh sách bình luận
         */
        getByPostId: async (postId, filters = {}) => {
            try {
                let query = supabase
                    .from('comments')
                    .select('*, user:user_id(username, email)')
                    .eq('post_id', postId)
                    .is('deleted_at', null);

                // Apply sorting
                if (filters.sortBy === 'newest') {
                    query = query.order('created_at', { ascending: false });
                } else {
                    query = query.order('created_at', { ascending: true });
                }

                // Apply pagination
                if (filters.limit) {
                    query = query.limit(filters.limit);
                }
                
                const { data, error } = await query;
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving comments');
                }

                RepositoryHelper.logInfo('Comments retrieved successfully', { 
                    postId, 
                    count: data.length,
                    filters 
                });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving comments');
            }
        },

        /**
         * Xóa một bình luận (hard delete - deprecated)
         * @param {string} commentId - ID của bình luận
         * @returns {boolean} - Trạng thái xóa
         */
        remove: async (commentId) => {
            try {
                const { error } = await supabase
                    .from('comments')
                    .delete()
                    .eq('id', commentId);
                    
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error deleting comment');
                }

                RepositoryHelper.logInfo('Comment deleted successfully', { commentId });
                return { success: true };
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error deleting comment');
            }
        },

        /**
         * Lấy bình luận theo ID
         * @param {string} commentId - ID của bình luận
         * @param {boolean} includeDeleted - Có bao gồm đã xóa không
         * @returns {Object} - Bình luận
         */
        getById: async (commentId, includeDeleted = false) => {
            try {
                let query = supabase
                    .from('comments')
                    .select('*, user:user_id(username, email)')
                    .eq('id', commentId);

                if (!includeDeleted) {
                    query = query.is('deleted_at', null);
                }

                const { data, error } = await query.single();
                
                if (error && error.code !== 'PGRST116') {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving comment by ID');
                }

                if (data) {
                    RepositoryHelper.logInfo('Comment retrieved successfully', { commentId });
                }
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving comment by ID');
            }
        },

        /**
         * Cập nhật nội dung bình luận
         * @param {string} commentId - ID của bình luận
         * @param {string} content - Nội dung mới
         * @returns {Object} - Bình luận đã cập nhật
         */
        updateContent: async (commentId, content) => {
            try {
                const { data, error } = await supabase
                    .from('comments')
                    .update({ 
                        content, 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', commentId)
                    .is('deleted_at', null)
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error updating comment');
                }

                RepositoryHelper.logInfo('Comment updated successfully', { commentId });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error updating comment');
            }
        },

        /**
         * Xóa mềm bình luận
         * @param {string} commentId - ID của bình luận
         * @returns {Object} - Bình luận đã xóa
         */
        softDelete: async (commentId) => {
            try {
                const { data, error } = await supabase
                    .from('comments')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', commentId)
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error soft deleting comment');
                }

                RepositoryHelper.logInfo('Comment soft deleted successfully', { commentId });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error soft deleting comment');
            }
        },

        /**
         * Khôi phục bình luận đã xóa
         * @param {string} commentId - ID của bình luận
         * @returns {Object} - Bình luận đã khôi phục
         */
        restore: async (commentId) => {
            try {
                const { data, error } = await supabase
                    .from('comments')
                    .update({ deleted_at: null })
                    .eq('id', commentId)
                    .select()
                    .single();
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error restoring comment');
                }

                RepositoryHelper.logInfo('Comment restored successfully', { commentId });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error restoring comment');
            }
        },

        /**
         * Đếm số bình luận của bài viết
         * @param {string} postId - ID của bài viết
         * @returns {number} - Số lượng bình luận
         */
        countByPostId: async (postId) => {
            try {
                const { count, error } = await supabase
                    .from('comments')
                    .select('id', { count: 'exact' })
                    .eq('post_id', postId)
                    .is('deleted_at', null);
                
                if (error) {
                    RepositoryHelper.logError('Error counting comments', error, { postId });
                    return 0;
                }

                RepositoryHelper.logInfo('Comments counted successfully', { postId, count });
                return count || 0;
            } catch (error) {
                RepositoryHelper.logError('Error counting comments', error, { postId });
                return 0;
            }
        },

        /**
         * Lấy bình luận mới nhất
         * @param {number} limit - Số lượng giới hạn
         * @returns {Array} - Danh sách bình luận mới nhất
         */
        getRecent: async (limit = 10) => {
            try {
                const { data, error } = await supabase
                    .from('comments')
                    .select('*, user:user_id(username), post:post_id(title, slug)')
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                
                if (error) {
                    throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving recent comments');
                }

                RepositoryHelper.logInfo('Recent comments retrieved successfully', { 
                    count: data.length,
                    limit 
                });
                return data;
            } catch (error) {
                throw RepositoryHelper.handleDatabaseError(error, 'Error retrieving recent comments');
            }
        }
    };
};

module.exports = { createCommentRepository };