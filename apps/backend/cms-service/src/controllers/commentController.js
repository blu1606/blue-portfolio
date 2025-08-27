// src/controllers/commentController.js
const asyncHandler = require('common/helpers/asyncHandler');
const { ResponseHelper } = require('../utils/responseHelper');
const { validateCommentData } = require('../utils/validation');
const { ForbiddenError, NotFoundError } = require('common/core/error.response');

const createCommentController = (container) => {
    return {
        createComment: asyncHandler(async (req, res) => {
            try {
                const { postId, content, parentId } = req.body;
                const userId = req.user.id;
                
                // Validate input data
                const validatedData = validateCommentData(content, postId, parentId);
                
                const createCommentUseCase = container.resolve('createCommentUseCase');
                const result = await createCommentUseCase(
                    validatedData.postId, 
                    userId, 
                    validatedData.content, 
                    validatedData.parentId
                );
                
                return ResponseHelper.created(res, 'Comment created successfully', result);
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        getCommentsByPost: asyncHandler(async (req, res) => {
            try {
                const { postId } = req.params;
                
                const getCommentsByPostUseCase = container.resolve('getCommentsByPostUseCase');
                const result = await getCommentsByPostUseCase(postId);
                
                return ResponseHelper.success(res, 'Comments retrieved successfully!', result);
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),
        
        deleteComment: asyncHandler(async (req, res) => {
            try {
                const { commentId } = req.params;
                const user = req.user;
                
                // Check permissions
                const comment = await container.resolve('commentRepository').getById(commentId);
                if (!comment) {
                    throw new NotFoundError('Comment not found.');
                }
                
                // Only author or admin can delete
                if (comment.user_id !== user.id && user.role !== 'admin') {
                    throw new ForbiddenError('You do not have permission to delete this comment.');
                }

                const deleteCommentUseCase = container.resolve('deleteCommentUseCase');
                await deleteCommentUseCase(commentId);
                
                return ResponseHelper.success(res, 'Comment deleted successfully!');
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),
    };
};

module.exports = { createCommentController };