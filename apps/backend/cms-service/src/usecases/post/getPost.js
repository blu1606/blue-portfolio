// src/usecases/getPost.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');

const createGetPostUseCase = (postRepository) => {
    return async (slug) => {
        if (!slug) throw new BadRequestError('Post slug is required.');

        // search cache before going to db
        const cacheKey = `post:slug:${slug}`;
        const cachedPost = await cacheService.get(cacheKey);
        if (cachedPost) {
            return { post: cachedPost };
        }


        const post = await postRepository.findBySlug(slug);

        if (!post) throw new NotFoundError('Post not found.');

        return {
            message: 'Post retrieved successfully',
            post
        };
    }
}

module.exports = { createGetPostUseCase };