// src/usecases/getPost.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');

const createGetPostUseCase = (postRepository, cacheService) => {
    return async (slug) => {
        if (!slug) throw new BadRequestError('Post slug is required.');

        // search cache before going to db
        const cacheKey = `post:slug:${slug}`;

        const post = await cacheService.getWithStale(cacheKey, async () => {
            return postRepository.findBySlug(slug);
        });

        if (!post) throw new NotFoundError('Post not found.');

        return {
            message: 'Post retrieved successfully',
            post
        };
    }
}

module.exports = { createGetPostUseCase };