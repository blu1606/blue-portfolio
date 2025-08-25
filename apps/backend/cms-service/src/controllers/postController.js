// src/controllers/postController.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const asyncHandler = require('common/helpers/asyncHandler');

const createPostController = (container) => {
    return {
        createPost: asyncHandler(async (req, res) => {
            const { title, content } = req.body;
            const authorId = req.user.id; // req.user has been transfer from authenticationMiddleware
            const files = req.files || []; // retrieve files from multer

            try {
                const createPostUseCase = container.resolve('createPostUseCase');
                const result = await createPostUseCase(title, content, authorId, files);
                
                return res.status(201).json({
                    success: true,
                    message: 'Post created successfully',
                    metadata: result
                });
            } catch (error) {
                if (error.statusCode === 400) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                } else if (error.statusCode === 409) {
                    return res.status(409).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error; // Re-throw if not handled
            }
        }),

        getAllPosts: asyncHandler(async (req, res) => {
            const { limit, offset } = req.query;
            
            // Check for non-numeric parameters first
            if (limit && isNaN(limit)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid limit parameter. Must be a number'
                });
            }
            
            if (offset && isNaN(offset)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid offset parameter. Must be a number'
                });
            }
            
            // Input validation
            const limitNum = limit ? parseInt(limit) : 20;
            const offsetNum = offset ? parseInt(offset) : 0;
            
            if (limitNum <= 0 || limitNum > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid limit parameter. Must be between 1 and 100'
                });
            }
            
            if (offsetNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid offset parameter. Must be non-negative'
                });
            }
            
            try {
                const getAllPostsUseCase = container.resolve('getAllPostsUseCase');
                const result = await getAllPostsUseCase(limitNum, offsetNum);
                
                return res.status(200).json({
                    success: true,
                    message: 'Posts retrieved successfully!',
                    metadata: {
                        posts: result.data || [],
                        total: result.total || 0
                    }
                });
            } catch (error) {
                if (error.statusCode === 400) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error;
            }
        }),

        searchPosts: asyncHandler(async (req, res) => {
            const { query, limit = 20, offset = 0 } = req.query;
            
            try {
                // Sanitize query to prevent XSS
                const sanitizedQuery = query?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                
                const searchPostsUseCase = container.resolve('searchPostsUseCase');
                const result = await searchPostsUseCase(sanitizedQuery, parseInt(limit), parseInt(offset));
                
                return res.status(200).json({
                    success: true,
                    message: 'Posts searched successfully',
                    metadata: {
                        posts: result.data || [],
                        total: result.total || 0,
                        query: sanitizedQuery,
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                });
            } catch (error) {
                if (error.statusCode === 400) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error;
            }
        }),

        // Update Post
        updatePost: asyncHandler(async (req, res) => {
            const { postId } = req.params;
            const updateData = req.body;
            const files = req.files || [];
            const authorId = req.user.id;

            try {
                const updatePostUseCase = container.resolve('updatePostUseCase');
                const cacheService = container.resolve('cacheService');
                
                const result = await updatePostUseCase(postId, updateData, authorId, files);
                
                // Invalidate cache after successful update
                const cache = cacheService.createCacheService();
                await cache.del(`post:${postId}`);
                await cache.del(`post:slug:${result.post.slug}`);
                await cache.del('posts:all');
                
                return res.status(200).json({
                    success: true,
                    message: 'Post updated successfully',
                    metadata: { post: result.post }
                });
            } catch (error) {
                if (error.statusCode === 403) {
                    return res.status(403).json({
                        success: false,
                        message: error.message
                    });
                } else if (error.statusCode === 404) {
                    return res.status(404).json({
                        success: false,
                        message: error.message
                    });
                } else if (error.statusCode === 400) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error;
            }
        }),

        // Delete Post
        deletePost: asyncHandler(async (req, res) => {
            const { postId } = req.params;
            const authorId = req.user.id;

            try {
                const deletePostUseCase = container.resolve('deletePostUseCase');
                const cacheService = container.resolve('cacheService');
                
                await deletePostUseCase(postId, authorId);
                
                // Invalidate cache after successful deletion
                const cache = cacheService.createCacheService();
                await cache.del(`post:${postId}`);
                await cache.del('posts:all');
                
                return res.status(200).json({
                    success: true,
                    message: 'Post deleted successfully'
                });
            } catch (error) {
                if (error.statusCode === 403) {
                    return res.status(403).json({
                        success: false,
                        message: error.message
                    });
                } else if (error.statusCode === 404) {
                    return res.status(404).json({
                        success: false,
                        message: error.message
                    });
                } else if (error.statusCode === 400) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error;
            }
        }),

        getPostBySlug: asyncHandler(async (req, res) => {
            const { slug } = req.params;
            
            // Sanitize slug input
            const sanitizedSlug = slug ? slug.replace(/[<>]/g, '') : '';

            try {
                const getPostUseCase = container.resolve('getPostUseCase');
                const cacheService = container.resolve('cacheService');
                const cache = cacheService.createCacheService();
                
                // Check cache first
                const cacheKey = `post:slug:${sanitizedSlug}`;
                const cachedPost = await cache.get(cacheKey);
                
                if (cachedPost) {
                    return res.status(200).json({
                        success: true,
                        message: 'Post retrieved successfully',
                        metadata: { post: JSON.parse(cachedPost) }
                    });
                }
                
                // Get from database
                const result = await getPostUseCase(sanitizedSlug);
                
                // Cache the result
                await cache.setex(cacheKey, 3600, JSON.stringify(result.post)); // Cache for 1 hour
                
                return res.status(200).json({
                    success: true,
                    message: 'Post retrieved successfully',
                    metadata: { post: result.post }
                });
            } catch (error) {
                if (error.statusCode === 404) {
                    return res.status(404).json({
                        success: false,
                        message: error.message
                    });
                } else if (error.statusCode === 400) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                throw error;
            }
        })
    }
}

module.exports = { createPostController };