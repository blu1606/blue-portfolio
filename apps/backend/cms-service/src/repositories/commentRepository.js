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
         * @returns {Array} - Danh sách bình luận
         */
        getByPostId: async (postId) => {
            const { data, error } = await supabase
                .from('comments')
                .select('*, user:user_id(username, email)')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error('Database error getting comments:', error);
                throw new BadRequestError('Failed to retrieve comments.');
            }
            return data;
        },

        /**
         * Xóa một bình luận
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
        }
    };
};

module.exports = { createCommentRepository };