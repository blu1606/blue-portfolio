// src/usecases/updatePost.js
const slugify = require('slugify');
const { BadRequestError, NotFoundError, ForbiddenError } = require('common/core/error.response');

const createUpdatePostUseCase = (postRepository) => {
    return async (postId, authorId, updateData) => {
        // 1. validation
        if (!postId || !authorId || !updateData) {
            throw new BadRequestError('Post ID, author ID, and update data are required.');
        }

        const { title, content, is_published } = updateData;
        if (!title && !content && is_published === undefined) {
            throw new BadRequestError('At least one field (title, content, or is_published) is required for update.');
        }

        // 2. find blog and check permission of the author
        const existingPost = await postRepository.findById(postId);
        if (!existingPost) {
            throw new NotFoundError('Post not found.');
        }
        if (existingPost.author_id !== authorId) {
            throw new ForbiddenError('You do not have permission to update this post.');
        }

        // 3. prepare updateData
        const updatedFields = { updated_at: new Date().toISOString() };
        if (title) {
            updatedFields.title = title;
            updatedFields.slug = slugify(title, { lower: true, strict: true });
        }
        if (content) updatedFields.content = content;
        if (is_published !== undefined) updatedFields.is_published = is_published;

        // 4. update post
        const updatedPost = await postRepository.update(postId, updatedFields);

        // 5. Cache invalidation: Xóa cache liên quan
        const cacheKey = `post:slug:${updatedPost.slug}`;
        await cacheService.del(cacheKey);
        
        return {
            post: {
                id: updatedPost.id,
                title: updatedPost.title,
                content: updatedPost.content,
                is_published: updatedPost.is_published,
                updated_at: updatedPost.updated_at
            },
            message: 'Post updated successfully.'
        }
    }
}

module.exports = { createUpdatePostUseCase };