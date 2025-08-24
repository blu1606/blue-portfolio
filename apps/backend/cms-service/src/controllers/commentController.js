// src/controllers/commentController.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const asyncHandler = require('common/helpers/asyncHandler');
const { ForbiddenError, NotFoundError } = require('common/core/error.response');

const createCommentController = (container) => {
    return {
        createComment: asyncHandler(async (req, res) => {
            const { postId } = req.params;
            const userId = req.user.id;
            const { content, parentId } = req.body;
            
            const createCommentUseCase = container.get('createCommentUseCase');
            const result = await createCommentUseCase(postId, userId, content, parentId);
            
            new CREATED({
                message: result.message,
                metadata: { id: result.id }
            }).send(res);
        }),

        getCommentsByPost: asyncHandler(async (req, res) => {
            const { postId } = req.params;
            const getCommentsByPostUseCase = container.get('getCommentsByPostUseCase');
            const result = await getCommentsByPostUseCase(postId);
            
            new SuccessResponse({
                message: 'Comments retrieved successfully!',
                metadata: result
            }).send(res);
        }),
        
        deleteComment: asyncHandler(async (req, res) => {
            const { commentId } = req.params;
            const user = req.user;
            
            // Logic kiểm tra quyền xóa
            const comment = await container.get('commentRepository').getById(commentId);
            if (!comment) {
                throw new NotFoundError('Comment not found.');
            }
            // Chỉ tác giả hoặc admin mới được xóa
            if (comment.user_id !== user.id && user.role !== 'admin') {
                throw new ForbiddenError('You do not have permission to delete this comment.');
            }

            const deleteCommentUseCase = container.get('deleteCommentUseCase');
            const result = await deleteCommentUseCase(commentId);
            
            new SuccessResponse({
                message: 'Comment deleted successfully!',
            }).send(res);
        }),
    };
};

module.exports = { createCommentController };