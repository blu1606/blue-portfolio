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
            const { query } = req.query;
            const searchPostsUseCase = container.get('searchPostsUseCase');
            const result = await searchPostsUseCase(query);
            
            new SuccessResponse({
                message: result.message,
                metadata: {
                    posts: result.posts,
                    total: result.totalResults,
                },
            }).send(res);
        })
    }
}

module.exports = { createPostController };