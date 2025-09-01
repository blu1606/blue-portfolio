const slugify = require('slugify');
const { ConflictRequestError, BadRequestError } = require('common/core/error.response');
const { processMarkdown } = require('../../utils/markdown');

const createCreatePostUseCase = (postRepository, cloudinaryService, mediaRepository, cacheService, rabbitmqPublisher) => {
    return async (postData) => {
        // Destructure with defaults
        const { 
            title, 
            content, 
            contentType = 'html', 
            authorId, 
            files = [] 
        } = postData;

        // Basic input validation
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new BadRequestError('Title is required and must be a non-empty string');
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            throw new BadRequestError('Content is required and must be a non-empty string');
        }
        if (!authorId || typeof authorId !== 'string' || authorId.trim().length === 0) {
            throw new BadRequestError('Author ID is required and must be a non-empty string');
        }
        if (!['html', 'markdown'].includes(contentType)) {
            throw new BadRequestError('Content type must be either "html" or "markdown"');
        }

        const slug = slugify(title, { lower: true, strict: true})

        // Check if post with the same slug already exists
        const existingPost = await postRepository.findBySlug(slug);
        if (existingPost) throw new ConflictRequestError('A Post with the same title already exists.');
        
        let content_html = null;
        let content_markdown = null;

        if (contentType === 'markdown') {
            content_markdown = content;
            content_html = processMarkdown(content);
        } else {
            content_html = content;
        }

        const postData = {
            title, 
            slug, 
            content_html, 
            content_markdown, 
            author_id: authorId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_published: false // draft by default
        };

    const newPost = await postRepository.create(postData);

        // upload files to Cloudinary and save to media table
        if (files.length > 0) {
            for (const file of files) {
                const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
                const { publicId, url } = await cloudinaryService.uploadFile(file.buffer, resourceType);
                await mediaRepository.create({
                    post_id: newPost.id,
                    type: resourceType,
                    public_id: publicId,
                    url: url,
                    alt_text: title // Or a more descriptive text from user input
                });
            }
        }
        
        // Invalidate cache for all posts list
        // Use invalidate API which is provided by the cache service abstraction/mocks
        if (cacheService) {
            if (typeof cacheService.invalidate === 'function') {
                await cacheService.invalidate('posts:all');
            } else if (typeof cacheService.del === 'function') {
                await cacheService.del('posts:all');
            }
        }

        if (rabbitmqPublisher && typeof rabbitmqPublisher.publish === 'function') {
            await rabbitmqPublisher.publish('posts.created', {
                eventType: 'posts.created',
                entityId: newPost.id,
                payload: {
                    id: newPost.id,
                    title: newPost.title,
                    slug: newPost.slug,
                    content_html: newPost.content_html,
                    created_at: newPost.created_at,
                    updated_at: newPost.updated_at
                }
            });
        }



        return {
            message: 'Post created successfully',
            post: newPost
        }
    }
}

module.exports = { createCreatePostUseCase };