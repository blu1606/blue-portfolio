const slugify = require('slugify');
const { BadRequestError, ConflictRequestError } = require('common/core/error.response');

const createCreatePostUseCase = (postRepository, cloudinaryService, mediaRepository, cacheService) => {
    return async (title, content, authorId, files = []) => {
        if (!title || !content || !authorId) throw new BadRequestError('Missing required fields');

        const slug = slugify(title, { lower: true, strict: true})

        // check if post with the same slug already exist or not
        const existingPost = await postRepository.findBySlug(slug);
        if (existingPost) throw new ConflictRequestError('A Post with the same title already exists.');
        
        const postData = {
            title, 
            slug, 
            content, 
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
        if (typeof cacheService.invalidate === 'function') {
            await cacheService.invalidate('posts:all');
        } else if (typeof cacheService.del === 'function') {
            await cacheService.del('posts:all');
        }


        return {
            message: 'Post created successfully',
            post: newPost
        }
    }
}

module.exports = { createCreatePostUseCase };