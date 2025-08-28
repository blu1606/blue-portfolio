// src/services/postService.js
const { BadRequestError, NotFoundError } = require('common/core/error.response');
const { CommonUtils, createLogger } = require('../utils');

const createPostService = (postRepository, tagService, mediaRepository, cloudinaryService) => {
    const logger = createLogger('PostService');
    
    const service = {
        // Generate URL-friendly slug using common utility
        generateSlug: (title) => {
            return CommonUtils.slugify(title).substring(0, 100); // Limit length
        },

        // Generate excerpt from content
        generateExcerpt: (content, maxLength = 160) => {
            if (!content) return '';
            
            // Remove markdown/HTML tags (simplified)
            const plainText = content
                .replace(/[#*_`\[\]()]/g, '')
                .replace(/\n+/g, ' ')
                .trim();
            
            if (plainText.length <= maxLength) {
                return plainText;
            }
            
            return plainText.substring(0, maxLength).trim() + '...';
        },

        // Create post with tags and thumbnail
        createPost: async (postData, authorId, files = {}) => {
            const { title, content, excerpt, tags = [], is_published = false } = postData;
            const { thumbnail } = files;

            // Generate slug from title
            const slug = service.generateSlug(title);
            
            // Check if slug already exists
            const existingPost = await postRepository.findBySlug(slug);
            if (existingPost) {
                throw new BadRequestError('Post with this title already exists.');
            }

            // Upload thumbnail if provided
            let thumbnailUrl = null;
            if (thumbnail) {
                try {
                    cloudinaryService.validateFile(thumbnail, 'image');
                    const uploadResult = await cloudinaryService.uploadThumbnail(
                        thumbnail.buffer, 
                        `temp_${Date.now()}`
                    );
                    thumbnailUrl = uploadResult.url;
                } catch (error) {
                    throw new BadRequestError(`Thumbnail upload failed: ${error.message}`);
                }
            }

            // Create post
            const newPost = await postRepository.create({
                title: title.trim(),
                slug,
                content,
                content_markdown: content, // Assuming markdown format
                content_html: content, // Would need markdown parser
                excerpt: excerpt?.trim() || service.generateExcerpt(content),
                author_id: authorId,
                thumbnail_url: thumbnailUrl,
                is_published,
                views_count: 0,
                comments_count: 0,
                content_type: 'markdown'
            });

            // Update thumbnail with actual post ID
            if (thumbnailUrl) {
                const updatedUpload = await cloudinaryService.uploadThumbnail(
                    thumbnail.buffer,
                    newPost.id
                );
                await postRepository.updateThumbnail(newPost.id, updatedUpload.url);
                newPost.thumbnail_url = updatedUpload.url;
            }

            // Link tags to post
            if (tags && tags.length > 0) {
                await tagService.linkTagsToPost(newPost.id, tags);
            }

            return newPost;
        },

        // Update post
        updatePost: async (postId, updateData, authorId, files = {}) => {
            const existingPost = await postRepository.findById(postId);
            if (!existingPost) {
                throw new NotFoundError('Post not found.');
            }

            if (existingPost.author_id !== authorId) {
                throw new BadRequestError('You can only update your own posts.');
            }

            const { title, content, excerpt, tags, is_published } = updateData;
            const { thumbnail } = files;
            const updates = {};

            // Update title and slug if changed
            if (title && title.trim() !== existingPost.title) {
                const newSlug = service.generateSlug(title.trim());
                const existingSlugPost = await postRepository.findBySlug(newSlug);
                
                if (existingSlugPost && existingSlugPost.id !== postId) {
                    throw new BadRequestError('Post with this title already exists.');
                }
                
                updates.title = title.trim();
                updates.slug = newSlug;
            }

            // Update content
            if (content !== undefined) {
                updates.content = content;
                updates.content_markdown = content;
                updates.content_html = content; // Would need markdown parser
            }

            // Update excerpt
            if (excerpt !== undefined) {
                updates.excerpt = excerpt?.trim() || 
                    (content ? service.generateExcerpt(content) : existingPost.excerpt);
            }

            // Update publication status
            if (is_published !== undefined) {
                updates.is_published = is_published;
            }

            // Upload new thumbnail if provided
            if (thumbnail) {
                try {
                    cloudinaryService.validateFile(thumbnail, 'image');
                    const uploadResult = await cloudinaryService.uploadThumbnail(
                        thumbnail.buffer,
                        postId
                    );
                    updates.thumbnail_url = uploadResult.url;

                    // Delete old thumbnail if exists
                    if (existingPost.thumbnail_url) {
                        // Extract public_id from URL and delete
                        // This would need proper URL parsing
                    }
                } catch (error) {
                    throw new BadRequestError(`Thumbnail upload failed: ${error.message}`);
                }
            }

            // Update post in database
            const updatedPost = await postRepository.update(postId, updates);

            // Update tags if provided
            if (tags !== undefined) {
                // First unlink existing tags
                await tagService.unlinkTagsFromPost(postId);
                
                // Then link new tags
                if (tags.length > 0) {
                    await tagService.linkTagsToPost(postId, tags);
                }
            }

            return updatedPost;
        },

        // Increment post views
        incrementViews: async (postId) => {
            try {
                await postRepository.updateViewsCount(postId);
                return { success: true };
            } catch (error) {
                logger.error('Error incrementing views', { postId, error: error.message });
                // Don't throw error, views increment is not critical
                return { success: false };
            }
        },

        // Get post with related data
        getPostWithDetails: async (postSlug, includeViews = true) => {
            const post = await postRepository.findBySlug(postSlug);
            if (!post || (!post.is_published && !includeViews)) {
                throw new NotFoundError('Post not found.');
            }

            // Increment views for published posts
            if (post.is_published && includeViews) {
                await service.incrementViews(post.id);
            }

            // Get tags for the post
            const tags = await tagService.getTagsByPostId(post.id);

            // Get media for the post
            const media = await mediaRepository.getByEntity('post', post.id);

            return {
                ...post,
                tags,
                media
            };
        },

        // Get popular posts
        getPopularPosts: async (limit = 10, timeframe = '30 days') => {
            return await postRepository.getPopular(limit, timeframe);
        },

        // Get related posts
        getRelatedPosts: async (postId, limit = 5) => {
            return await postRepository.getRelated(postId, limit);
        },

        // Search posts
        searchPosts: async (query, filters = {}) => {
            const searchFilters = {
                published: true,
                ...filters
            };

            // Use repository search method
            return await postRepository.searchByRegExp({
                patterns: [query],
                fields: ['title', 'content', 'excerpt'],
                options: {
                    limit: filters.limit || 10,
                    offset: filters.offset || 0
                }
            });
        },

        // Get posts by tag
        getPostsByTag: async (tagSlug, filters = {}) => {
            return await tagService.getPostsByTag(tagSlug, filters);
        },

        // Soft delete post
        deletePost: async (postId, authorId) => {
            const post = await postRepository.findById(postId);
            if (!post) {
                throw new NotFoundError('Post not found.');
            }

            if (post.author_id !== authorId) {
                throw new BadRequestError('You can only delete your own posts.');
            }

            // Unlink tags first
            await tagService.unlinkTagsFromPost(postId);

            // Soft delete post
            return await postRepository.softDelete(postId);
        },

        // Restore deleted post
        restorePost: async (postId, authorId) => {
            const post = await postRepository.findById(postId, true); // Include deleted
            if (!post) {
                throw new NotFoundError('Post not found.');
            }

            if (post.author_id !== authorId) {
                throw new BadRequestError('You can only restore your own posts.');
            }

            return await postRepository.restore(postId);
        },

        // Get post statistics
        getPostStats: async (authorId = null) => {
            const filters = {};
            if (authorId) {
                filters.authorId = authorId;
            }

            const allPosts = await postRepository.getAll(filters);
            const publishedPosts = allPosts.filter(post => post.is_published);
            const draftPosts = allPosts.filter(post => !post.is_published);

            return {
                total: allPosts.length,
                published: publishedPosts.length,
                drafts: draftPosts.length,
                totalViews: allPosts.reduce((sum, post) => sum + (post.views_count || 0), 0),
                totalComments: allPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0),
                averageViews: publishedPosts.length > 0 
                    ? publishedPosts.reduce((sum, post) => sum + (post.views_count || 0), 0) / publishedPosts.length 
                    : 0
            };
        }
    };

    return service;
};

module.exports = { createPostService };
