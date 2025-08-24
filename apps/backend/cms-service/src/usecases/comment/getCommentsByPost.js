// src/usecases/getCommentsByPost.js
const { BadRequestError } = require('common/core/error.response');

const createGetCommentsByPostUseCase = (commentRepository) => {
    return async (postId) => {
        if (!postId) {
            throw new BadRequestError('Post ID is required.');
        }
        
        const comments = await commentRepository.getByPostId(postId);

        // Logic để biến danh sách comments thành cấu trúc cây lồng nhau
        const commentMap = new Map();
        const rootComments = [];

        comments.forEach(comment => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        comments.forEach(comment => {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies.push(commentMap.get(comment.id));
                }
            } else {
                rootComments.push(commentMap.get(comment.id));
            }
        });

        return {
            comments: rootComments,
            total: comments.length
        };
    };
};

module.exports = { createGetCommentsByPostUseCase };