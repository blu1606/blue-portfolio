// src/controllers/commentController.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const asyncHandler = require('common/helpers/asyncHandler');
const { ForbiddenError, NotFoundError } = require('common/core/error.response');

const createCommentController = (container) => {
    return {
        createComment: asyncHandler(async (req, res) => {
            const { postId, content, parentId } = req.body;
            const userId = req.user.id;
            
            try {
                const createCommentUseCase = container.resolve('createCommentUseCase');
                const result = await createCommentUseCase(postId, userId, content, parentId);
                
                return res.status(201).json({
                    success: true,
                    message: 'Comment created successfully',
                    metadata: result
                });
            } catch (error) {
                if (error.statusCode === 400) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                } else if (error.statusCode === 404) {
                    return res.status(404).json({
                        success: false,
                        message: error.message
                    });
                } else if (error.statusCode === 500) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error;
            }
        }),

        getCommentsByPost: asyncHandler(async (req, res) => {
            const { postId } = req.params;
            const getCommentsByPostUseCase = container.resolve('getCommentsByPostUseCase');
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
            const comment = await container.resolve('commentRepository').getById(commentId);
            if (!comment) {
                throw new NotFoundError('Comment not found.');
            }
            // Chỉ tác giả hoặc admin mới được xóa
            if (comment.user_id !== user.id && user.role !== 'admin') {
                throw new ForbiddenError('You do not have permission to delete this comment.');
            }

            const deleteCommentUseCase = container.resolve('deleteCommentUseCase');
            const result = await deleteCommentUseCase(commentId);
            
            new SuccessResponse({
                message: 'Comment deleted successfully!',
            }).send(res);
        }),
    };
};

module.exports = { createCommentController };