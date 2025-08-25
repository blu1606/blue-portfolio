// src/usecases/updatePost.js
const slugify = require('slugify');
const { BadRequestError, NotFoundError, ForbiddenError } = require('common/core/error.response');
const { processMarkdown } = require('../../utils/markdown');


const createUpdatePostUseCase = (postRepository, cacheService) => {
    return async (postId, updateData, authorId, files) => {
        // 1. validation
        if (!postId || !authorId || !updateData) {
            throw new BadRequestError('Post ID, author ID, and update data are required.');
        }

        const { title, content, contentType, is_published } = updateData;
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

        // Handle content update logic
        if (content || contentType) {
            let newContentType = contentType || existingPost.content_type || 'html';
            updatedFields.content_type = newContentType;
            
            if (newContentType === 'markdown') {
                updatedFields.content_markdown = content || existingPost.content_markdown;
                updatedFields.content_html = processMarkdown(updatedFields.content_markdown);
            } else {
                updatedFields.content_html = content || existingPost.content_html;
                updatedFields.content_markdown = null; // Clear markdown if type changes to html
            }
        }


        // 4. update post
        const updatedPost = await postRepository.update(postId, updatedFields);

        // 5. Cache invalidation: delete related cache keys
        try {
            if (cacheService) {
                if (typeof cacheService.del === 'function') await cacheService.del(`post:slug:${updatedPost.slug}`);
                if (typeof cacheService.delByPattern === 'function') await cacheService.delByPattern('posts:all*');
                else if (typeof cacheService.invalidate === 'function') await cacheService.invalidate('posts:all');
            }
        } catch (err) {
            console.error('Cache invalidation failed:', err);
        }

        return {
            post: {
                id: updatedPost.id,
                title: updatedPost.title,
                content_html: updatedPost.content_html,
                content_markdown: updatedPost.content_markdown,
                content_type: updatedPost.content_type,
                is_published: updatedPost.is_published,
                updated_at: updatedPost.updated_at
            },
            message: 'Post updated successfully.'
        }
    }
}

module.exports = { createUpdatePostUseCase };