// src/usecases/createComment.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');

const createCreateCommentUseCase = (commentRepository, postRepository) => {
    return async (postId, userId, content, parentId = null) => {
        if (!postId || !userId || !content) {
            throw new BadRequestError('Post ID, user ID, and content are required.');
        }

        // Kiểm tra xem bài viết có tồn tại không
        const existingPost = await postRepository.findById(postId);
        if (!existingPost) {
            throw new NotFoundError('Post not found.');
        }

        // Kiểm tra parent comment có tồn tại không nếu có parentId
        if (parentId) {
            const parentComment = await commentRepository.getById(parentId);
            if (!parentComment) {
                throw new NotFoundError('Parent comment not found.');
            }
        }
        
        const commentData = {
            post_id: postId,
            user_id: userId,
            content,
            parent_id: parentId,
            created_at: new Date().toISOString(),
            is_approved: true // Mặc định là duyệt ngay để đơn giản
        };
        
        const newComment = await commentRepository.create(commentData);
        
        return {
            id: newComment.id,
            message: 'Comment added successfully!'
        };
    };
};

module.exports = { createCreateCommentUseCase };