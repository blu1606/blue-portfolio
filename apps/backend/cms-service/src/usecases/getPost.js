// src/usecases/getPost.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');

const createGetPostUseCase = (postRepository) => {
    return async (slug) => {
        if (!slug) throw new BadRequestError('Post slug is required.');

        const post = await postRepository.findBySlug(slug);

        if (!post) throw new NotFoundError('Post not found.');

        return {
            message: 'Post retrieved successfully',
            post
        };
    }
}

module.exports = { createGetPostUseCase };