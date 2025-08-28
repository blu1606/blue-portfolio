// src/controllers/commentController.js
const asyncHandler = require('common/helpers/asyncHandler');
const { SuccessResponse, CREATED } = require('common/core/success.response');
const { validateCommentData } = require('../utils/validation');
const { ForbiddenError, NotFoundError } = require('common/core/error.response');

// Simple error handler
const handleError = (res, error) => {
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message
        });
    }
    
    console.error('Unhandled error:', error);
    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
};

const createCommentController = (container) => {
    return {
        createComment: asyncHandler(async (req, res) => {
            try {
                const { postId, content, parentId } = req.body;
                const userId = req.user.id;
                
                // Validate input data
                const validatedData = validateCommentData(content, postId, parentId);
                
                const createCommentUseCase = container.get('createCommentUseCase');
                const result = await createCommentUseCase(
                    validatedData.postId, 
                    userId, 
                    validatedData.content, 
                    validatedData.parentId
                );
                
                return new CREATED({
                    message: 'Comment created successfully',
                    metadata: result
                }).send(res);
            } catch (error) {
                return handleError(res, error);
            }
        }),

        getCommentsByPost: asyncHandler(async (req, res) => {
            try {
                const { postId } = req.params;
                
                const getCommentsByPostUseCase = container.get('getCommentsByPostUseCase');
                const result = await getCommentsByPostUseCase(postId);
                
                return new SuccessResponse({
                    message: 'Comments retrieved successfully!',
                    metadata: result
                }).send(res);
            } catch (error) {
                return handleError(res, error);
            }
        }),
        
        deleteComment: asyncHandler(async (req, res) => {
            try {
                const { commentId } = req.params;
                const user = req.user;
                
                // Check permissions
                const comment = await container.get('commentRepository').getById(commentId);
                if (!comment) {
                    throw new NotFoundError('Comment not found.');
                }
                
                // Only author or admin can delete
                if (comment.user_id !== user.id && user.role !== 'admin') {
                    throw new ForbiddenError('You do not have permission to delete this comment.');
                }

                const deleteCommentUseCase = container.get('deleteCommentUseCase');
                await deleteCommentUseCase(commentId);
                
                return new SuccessResponse({
                    message: 'Comment deleted successfully!'
                }).send(res);
            } catch (error) {
                return handleError(res, error);
            }
        }),
    };
};

module.exports = { createCommentController };