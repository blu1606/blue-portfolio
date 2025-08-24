// src/controllers/postController.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const asyncHandler = require('common/helpers/asyncHandler');

const createPostController = (container) => {
    return {
        createPost: asyncHandler(async (req, res) => {
            const { title, content } = req.body;
            const authorId = req.user.id; // req.user has been transfer from authenticationMiddlerware
            const files = req.files || []; // retrieve files from multer

            const createPostUsecase = container.get('createPostUseCase');
            const result = await createPostUsecase(title, content, authorId, files);
            new CREATED({
                message: result.message,
                metadata: result.post
            }).send(res);
        }),

        getAllPosts: asyncHandler(async (req, res) => {
            const { limit, offset } = req.query;
            const getAllPostsUseCase = container.get('getAllPostsUseCase');
            
            const result = await getAllPostsUseCase(
                parseInt(limit) || 20,
                parseInt(offset) || 0
            );
            
            new SuccessResponse({
                message: 'Posts retrieved successfully!',
                metadata: result,
            }).send(res);
        }),

        // Cập nhật bài viết
        updatePost: asyncHandler(async (req, res) => {
            const { postId } = req.params;
            const authorId = req.user.id;
            const updateData = req.body;
            
            const updatePostUseCase = container.get('updatePostUseCase');
            const result = await updatePostUseCase(postId, authorId, updateData);
            
            new SuccessResponse({
                message: result.message,
                metadata: result.post,
            }).send(res);
        }),

        // Xóa bài viết
        deletePost: asyncHandler(async (req, res) => {
            const { postId } = req.params;
            const authorId = req.user.id;
            
            const deletePostUseCase = container.get('deletePostUseCase');
            const result = await deletePostUseCase(postId, authorId);
            
            new SuccessResponse({
                message: result.message,
            }).send(res);
        }),

        getPostBySlug: asyncHandler(async (req, res) => {
            const { slug } = req.params;

            const getPostUsecase = container.get('getPostUsecase');
            const result = await getPostUsecase(slug);
            new SuccessResponse({
                message: result.message,
                metadata: result.post
            }).send(res);
        }),

        searchPosts: asyncHandler(async (req, res) => {
            const { query, limit, offset } = req.query;
            const searchPostsUseCase = container.get('searchPostsUseCase');
            const result = await searchPostsUseCase(query, {
                limit: parseInt(limit) || 20,
                offset: parseInt(offset) || 0
            });

            new SuccessResponse({
                message: result.message,
                metadata: result,
            }).send(res);
        })
    }
}

module.exports = { createPostController };