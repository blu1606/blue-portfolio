const slugify = require('slugify');
const { BadRequestError, ConflictRequestError } = require('common/core/error.response');

const createCreatePostUseCase = (postRepository) => {
    return async (title, content, authorId ) => {
        if (!title || !content || !authorId) throw new BadRequestError('Missing required fields');

        const slug = slugify(title, { lower: true, strict: true})

        // check if post with the same slug already exist or not
        const existingPost = await postRepository.findBySlug(slug);
        if (existingPost) throw new ConflictRequestError('A Post with the same title already exists.')
        
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

        return {
            message: 'Post created successfully',
            post: newPost
        }
    }
}

module.exports = { createCreatePostUseCase };