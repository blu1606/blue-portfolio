// src/services/tagService.js
const { BadRequestError } = require('common/core/error.response');
const { createLogger } = require('common/utils/logger');

const createTagService = (tagRepository, postTagRepository) => {
    const logger = createLogger('TagService');
    
    const service = {
        // Generate URL-friendly slug from tag name
        generateSlug: (name) => {
            return name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
        },

        // Create new tag with auto-generated slug
        createTag: async (tagData) => {
            const { name, description } = tagData;
            
            if (!name || name.trim().length < 2) {
                throw new BadRequestError('Tag name must be at least 2 characters long.');
            }

            // Generate slug from name
            const slug = service.generateSlug(name);
            
            // Check if tag with this slug already exists
            const existingTag = await tagRepository.findBySlug(slug);
            if (existingTag) {
                throw new BadRequestError('Tag with this name already exists.');
            }

            // Create tag
            const newTag = await tagRepository.create({
                name: name.trim(),
                slug,
                description: description?.trim() || null,
                posts_count: 0
            });

            return newTag;
        },

        // Get tag by ID
        getTagById: async (tagId) => {
            try {
                const tag = await tagRepository.findById(tagId);
                if (!tag) {
                    throw new BadRequestError('Tag not found.');
                }
                logger.info('Tag retrieved successfully', { tagId });
                return tag;
            } catch (error) {
                logger.error('Error getting tag by ID', { tagId, error: error.message });
                throw new BadRequestError('Failed to retrieve tag.');
            }
        },

        // Get all active tags
        getAllActiveTags: async (filters = {}) => {
            try {
                const { limit = 50, offset = 0, includeEmpty = false } = filters;
                
                const tags = await tagRepository.findAll({
                    limit,
                    offset,
                    includeEmpty
                });

                logger.info('Active tags retrieved successfully', { 
                    count: tags.length, 
                    limit, 
                    offset 
                });
                
                return {
                    tags,
                    pagination: {
                        limit,
                        offset,
                        total: tags.length
                    }
                };
            } catch (error) {
                logger.error('Error getting all active tags', { error: error.message });
                throw new BadRequestError('Failed to retrieve tags.');
            }
        },

        // Get popular tags with post counts
        getPopularTags: async (limit = 10) => {
            try {
                const tags = await tagRepository.getPopular(limit);
                logger.info('Popular tags retrieved successfully', { count: tags.length, limit });
                return tags;
            } catch (error) {
                logger.error('Error getting popular tags', { limit, error: error.message });
                throw new BadRequestError('Failed to retrieve popular tags.');
            }
        },

        // Search tags by name
        searchTags: async (query, limit = 20) => {
            if (!query || query.trim().length < 1) {
                return [];
            }

            try {
                const tags = await tagRepository.findAll({
                    search: query.trim(),
                    limit
                });
                logger.info('Tag search completed', { query, limit, results: tags.length });
                return tags;
            } catch (error) {
                logger.error('Error searching tags', { query, limit, error: error.message });
                throw new BadRequestError('Failed to search tags.');
            }
        },

        // Get or create tags by names (useful for post creation)
        getOrCreateTags: async (tagNames) => {
            if (!Array.isArray(tagNames) || tagNames.length === 0) {
                return [];
            }

            const tags = [];
            const uniqueNames = [...new Set(tagNames.map(name => name.trim().toLowerCase()))];

            for (const name of uniqueNames) {
                if (name.length < 2) continue;

                const slug = service.generateSlug(name);
                let tag = await tagRepository.findBySlug(slug);

                if (!tag) {
                    // Create new tag
                    tag = await tagRepository.create({
                        name,
                        slug,
                        description: null,
                        posts_count: 0
                    });
                }

                tags.push(tag);
            }

            return tags;
        },

        // Update tag information
        updateTag: async (tagId, updateData) => {
            const { name, description } = updateData;
            
            const existingTag = await tagRepository.findById(tagId);
            if (!existingTag) {
                throw new BadRequestError('Tag not found.');
            }

            const updates = {};
            
            if (name && name.trim() !== existingTag.name) {
                const newSlug = service.generateSlug(name.trim());
                const existingTagWithSlug = await tagRepository.findBySlug(newSlug);
                
                if (existingTagWithSlug && existingTagWithSlug.id !== tagId) {
                    throw new BadRequestError('Tag with this name already exists.');
                }
                
                updates.name = name.trim();
                updates.slug = newSlug;
            }

            if (description !== undefined) {
                updates.description = description?.trim() || null;
            }

            if (Object.keys(updates).length === 0) {
                return existingTag;
            }

            return await tagRepository.update(tagId, updates);
        },

        // Link tags to a post and update counts
        linkTagsToPost: async (postId, tagNames) => {
            if (!Array.isArray(tagNames) || tagNames.length === 0) {
                return [];
            }

            // Get or create tags
            const tags = await service.getOrCreateTags(tagNames);
            const tagIds = tags.map(tag => tag.id);

            // Link tags to post
            await postTagRepository.replacePostTags(postId, tagIds);

            // Update post counts for each tag
            for (const tag of tags) {
                await tagRepository.updatePostsCount(tag.id, 1);
            }

            return tags;
        },

        // Unlink tags from post and update counts
        unlinkTagsFromPost: async (postId) => {
            // Get current tags for the post
            const currentTags = await postTagRepository.getTagsByPostId(postId);
            
            // Unlink all tags
            await postTagRepository.unlinkAllPostTags(postId);

            // Decrease post counts
            for (const tag of currentTags) {
                await tagRepository.updatePostsCount(tag.id, -1);
            }

            return currentTags;
        },

        // Get posts by tag with pagination
        getPostsByTag: async (tagSlug, filters = {}) => {
            const tag = await tagRepository.findBySlug(tagSlug);
            if (!tag) {
                throw new BadRequestError('Tag not found.');
            }

            const posts = await postTagRepository.getPostsByTagId(tag.id, filters);
            
            return {
                tag,
                posts,
                pagination: {
                    limit: filters.limit || 10,
                    offset: filters.offset || 0
                }
            };
        },

        // Get tag statistics
        getTagStats: async () => {
            const allTags = await tagRepository.findAll();
            
            return {
                totalTags: allTags.length,
                tagsWithPosts: allTags.filter(tag => tag.posts_count > 0).length,
                mostPopularTag: allTags.reduce((max, tag) => 
                    tag.posts_count > (max?.posts_count || 0) ? tag : max, null
                ),
                averagePostsPerTag: allTags.length > 0 
                    ? allTags.reduce((sum, tag) => sum + tag.posts_count, 0) / allTags.length 
                    : 0
            };
        },

        // Delete tag (soft delete)
        deleteTag: async (tagId) => {
            const tag = await tagRepository.findById(tagId);
            if (!tag) {
                throw new BadRequestError('Tag not found.');
            }

            // Unlink from all posts first
            await postTagRepository.unlinkAllPostTags(tagId);

            // Soft delete the tag
            return await tagRepository.softDelete(tagId);
        },

        // Restore deleted tag
        restoreTag: async (tagId) => {
            return await tagRepository.restore(tagId);
        }
    };

    return service;
};

module.exports = { createTagService };
