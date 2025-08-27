// src/repositories/commentRepository.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');

const createCommentRepository = (supabase) => {
    return {
        /**
         * Tạo một bình luận mới
         * @param {Object} commentData - Dữ liệu bình luận
         * @returns {Object} - Bình luận đã được tạo
         */
        create: async (commentData) => {
            const { data, error } = await supabase
                .from('comments')
                .insert([commentData])
                .select()
                .single();
            
            if (error) {
                console.error('Database error creating comment:', error);
                throw new BadRequestError('Failed to create comment.');
            }
            return data;
        },

        /**
         * Lấy tất cả bình luận của một bài viết
         * @param {string} postId - ID của bài viết
         * @param {Object} filters - Bộ lọc
         * @returns {Array} - Danh sách bình luận
         */
        getByPostId: async (postId, filters = {}) => {
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
                console.error('Database error getting comments:', error);
                throw new BadRequestError('Failed to retrieve comments.');
            }
            return data;
        },

        /**
         * Xóa một bình luận (hard delete - deprecated)
         * @param {string} commentId - ID của bình luận
         * @returns {boolean} - Trạng thái xóa
         */
        remove: async (commentId) => {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);
                
            if (error) {
                console.error('Database error deleting comment:', error);
                throw new BadRequestError('Failed to delete comment.');
            }
            return { success: true };
        },

        /**
         * Lấy bình luận theo ID
         * @param {string} commentId - ID của bình luận
         * @param {boolean} includeDeleted - Có bao gồm đã xóa không
         * @returns {Object} - Bình luận
         */
        getById: async (commentId, includeDeleted = false) => {
            let query = supabase
                .from('comments')
                .select('*, user:user_id(username, email)')
                .eq('id', commentId);

            if (!includeDeleted) {
                query = query.is('deleted_at', null);
            }

            const { data, error } = await query.single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Database error getting comment by ID:', error);
                throw new BadRequestError('Failed to retrieve comment.');
            }
            return data;
        },

        /**
         * Cập nhật nội dung bình luận
         * @param {string} commentId - ID của bình luận
         * @param {string} content - Nội dung mới
         * @returns {Object} - Bình luận đã cập nhật
         */
        updateContent: async (commentId, content) => {
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
                console.error('Database error updating comment:', error);
                throw new BadRequestError('Failed to update comment.');
            }
            return data;
        },

        /**
         * Xóa mềm bình luận
         * @param {string} commentId - ID của bình luận
         * @returns {Object} - Bình luận đã xóa
         */
        softDelete: async (commentId) => {
            const { data, error } = await supabase
                .from('comments')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', commentId)
                .select()
                .single();
            
            if (error) {
                console.error('Database error soft deleting comment:', error);
                throw new BadRequestError('Failed to delete comment.');
            }
            return data;
        },

        /**
         * Khôi phục bình luận đã xóa
         * @param {string} commentId - ID của bình luận
         * @returns {Object} - Bình luận đã khôi phục
         */
        restore: async (commentId) => {
            const { data, error } = await supabase
                .from('comments')
                .update({ deleted_at: null })
                .eq('id', commentId)
                .select()
                .single();
            
            if (error) {
                console.error('Database error restoring comment:', error);
                throw new BadRequestError('Failed to restore comment.');
            }
            return data;
        },

        /**
         * Đếm số bình luận của bài viết
         * @param {string} postId - ID của bài viết
         * @returns {number} - Số lượng bình luận
         */
        countByPostId: async (postId) => {
            const { count, error } = await supabase
                .from('comments')
                .select('id', { count: 'exact' })
                .eq('post_id', postId)
                .is('deleted_at', null);
            
            if (error) {
                console.error('Database error counting comments:', error);
                return 0;
            }
            return count || 0;
        },

        /**
         * Lấy bình luận mới nhất
         * @param {number} limit - Số lượng giới hạn
         * @returns {Array} - Danh sách bình luận mới nhất
         */
        getRecent: async (limit = 10) => {
            const { data, error } = await supabase
                .from('comments')
                .select('*, user:user_id(username), post:post_id(title, slug)')
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('Database error getting recent comments:', error);
                throw new BadRequestError('Failed to retrieve recent comments.');
            }
            return data;
        }
    };
};

module.exports = { createCommentRepository };