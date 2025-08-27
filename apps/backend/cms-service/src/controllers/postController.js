// src/controllers/postController.js
const asyncHandler = require('common/helpers/asyncHandler');
const { ResponseHelper } = require('../utils/responseHelper');
const { validatePostData, validatePagination } = require('../utils/validation');
const { validatePostFiles } = require('../utils/fileValidation');

const createPostController = (container) => {
    return {
        createPost: asyncHandler(async (req, res) => {
            try {
                const { title, content, contentType } = req.body;
                const authorId = req.user.id;
                
                // Validate input data
                const validatedData = validatePostData(title, content, contentType);
                
                // Validate files
                const { files } = validatePostFiles(req.files);
                
                const createPostUseCase = container.resolve('createPostUseCase');
                const result = await createPostUseCase(
                    validatedData.title, 
                    validatedData.content, 
                    validatedData.contentType, 
                    authorId, 
                    files
                );

                // Normalize result for backward compatibility
                const metadata = result?.post || result;
                
                return ResponseHelper.created(res, 'Post created successfully', metadata);
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        getAllPosts: asyncHandler(async (req, res) => {
            try {
                const { limit, offset } = validatePagination(req.query.limit, req.query.offset);
                
                const getAllPostsUseCase = container.resolve('getAllPostsUseCase');
                const result = await getAllPostsUseCase(limit, offset);
                
                return ResponseHelper.paginatedResponse(
                    res,
                    'Posts retrieved successfully!',
                    result.data || [],
                    result.total || 0,
                    limit,
                    offset
                );
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        searchPosts: asyncHandler(async (req, res) => {
            try {
                const { query } = req.query;
                const { limit, offset } = validatePagination(req.query.limit, req.query.offset);
                
                const searchPostsUseCase = container.resolve('searchPostsUseCase');
                const result = await searchPostsUseCase(query, limit, offset);
                
                return ResponseHelper.paginatedResponse(
                    res,
                    'Posts searched successfully',
                    result.data || [],
                    result.total || 0,
                    limit,
                    offset
                );
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        getPostById: asyncHandler(async (req, res) => {
            try {
                const { postId } = req.params;

                const getPostUseCase = container.resolve('getPostUseCase');
                const result = await getPostUseCase(postId);
                
                return ResponseHelper.success(res, 'Post retrieved successfully', { post: result });
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        updatePost: asyncHandler(async (req, res) => {
            try {
                const { postId } = req.params;
                const updateData = req.body;
                const files = req.files || [];
                const authorId = req.user.id;

                const updatePostUseCase = container.resolve('updatePostUseCase');
                const cacheService = container.resolve('cacheService');
                
                const result = await updatePostUseCase(postId, updateData, authorId, files);
                
                // Invalidate cache after successful update
                try {
                    if (cacheService && typeof cacheService.createCacheService === 'function') {
                        const cache = cacheService.createCacheService();
                        await cache.del(`post:${postId}`);
                        await cache.del(`post:slug:${result.post.slug}`);
                        await cache.del('posts:all');
                    } else if (cacheService && typeof cacheService.invalidate === 'function') {
                        await cacheService.invalidate('posts:all');
                    }
                } catch (cacheError) {
                    console.error('Cache invalidation failed:', cacheError);
                }
                
                return ResponseHelper.success(res, 'Post updated successfully', { post: result.post });
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        deletePost: asyncHandler(async (req, res) => {
            try {
                const { postId } = req.params;
                const authorId = req.user.id;

                const deletePostUseCase = container.resolve('deletePostUseCase');
                const cacheService = container.resolve('cacheService');
                
                await deletePostUseCase(postId, authorId);
                
                // Invalidate cache after successful deletion
                try {
                    if (cacheService && typeof cacheService.createCacheService === 'function') {
                        const cache = cacheService.createCacheService();
                        await cache.del(`post:${postId}`);
                        await cache.del('posts:all');
                    } else if (cacheService && typeof cacheService.invalidate === 'function') {
                        await cacheService.invalidate('posts:all');
                    }
                } catch (cacheError) {
                    console.error('Cache invalidation failed:', cacheError);
                }
                
                return ResponseHelper.success(res, 'Post deleted successfully');
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        getPostBySlug: asyncHandler(async (req, res) => {
            try {
                const { slug } = req.params;

                const getPostUseCase = container.resolve('getPostUseCase');
                const result = await getPostUseCase(slug);
                
                return ResponseHelper.success(res, 'Post retrieved successfully', { post: result });
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        }),

        // Missing getPostById method
        getPostById: asyncHandler(async (req, res) => {
            try {
                const { postId } = req.params;
                
                const getPostUseCase = container.resolve('getPostUseCase');
                const result = await getPostUseCase(postId);
                
                return ResponseHelper.success(res, 'Post retrieved successfully', { post: result });
            } catch (error) {
                return ResponseHelper.handleError(res, error);
            }
        })
    };
};

module.exports = { createPostController };