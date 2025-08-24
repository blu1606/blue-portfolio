// src/controllers/postController.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const asyncHandler = require('common/helpers/asyncHandler');

const createPostController = (container) => {
    return {
        createPost: asyncHandler(async (req, res) => {
            const { title, content } = req.body;
            const authorId = req.user.id; // req.user has been transfer from authenticationMiddlerware

            const createPostUsecase = container.get('createPostUsecase');
            const result = await createPostUsecase(title, content, authorId);
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
        })
    }
}

module.exports = { createPostController };