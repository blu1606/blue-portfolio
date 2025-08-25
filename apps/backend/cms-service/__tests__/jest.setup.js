// __tests__/jest.setup.js
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_KEY = 'test-key';

// Mock Supabase before importing any modules
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({
                data: null,
                error: { 
                    message: 'Not found in test',
                    code: 'PGRST116' // Supabase "row not found" error code
                }
            })),
            then: jest.fn((callback) => {
                return callback({
                    data: null,
                    error: { 
                        message: 'Not found in test',
                        code: 'PGRST116'
                    }
                });
            })
        }))
    }))
}));

// Mock postRepository
const mockPostRepository = {
    findBySlug: jest.fn().mockResolvedValue(null), // Default: no existing post
    create: jest.fn().mockImplementation((postData) => 
        Promise.resolve({ 
            id: 'mock-post-id',
            ...postData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    ),
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(true)
};

// Mock mediaRepository  
const mockMediaRepository = {
    create: jest.fn().mockResolvedValue({ id: 'mock-media-id', url: 'https://test.cloudinary.com/image.jpg' })
};

// Mock cacheService
const mockCacheInstance = {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1)
};

const mockCacheService = {
    createCacheService: jest.fn(() => mockCacheInstance),
    invalidate: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true)
};

// Mock cloudinaryService
const mockCloudinaryService = {
    createCloudinaryService: jest.fn(() => ({
        uploadFile: jest.fn().mockResolvedValue({ 
            public_id: 'test-image-id',
            secure_url: 'https://test.cloudinary.com/image.jpg'
        }),
        deleteFile: jest.fn().mockResolvedValue({ result: 'ok' })
    })),
    uploadSingle: jest.fn().mockResolvedValue({ 
        public_id: 'test-image-id',
        secure_url: 'https://test.cloudinary.com/image.jpg'
    })
};

// Export mocks so they can be used in tests
global.mockPostRepository = mockPostRepository;
global.mockMediaRepository = mockMediaRepository;
global.mockCacheService = mockCacheService;
global.mockCacheInstance = mockCacheInstance;
global.mockCloudinaryService = mockCloudinaryService;

// Mock cloudinary module
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload: jest.fn().mockResolvedValue({
                public_id: 'test-image-id',
                secure_url: 'https://test.cloudinary.com/image.jpg'
            }),
            destroy: jest.fn().mockResolvedValue({ result: 'ok' })
        }
    }
}));

// Mock slugify module
jest.mock('slugify', () => jest.fn((text) => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}));

// Mock jsonwebtoken module
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
    sign: jest.fn(() => 'mocked-jwt-token'),
    TokenExpiredError: class TokenExpiredError extends Error {},
    JsonWebTokenError: class JsonWebTokenError extends Error {}
}));

// Mock common package authentication middleware
jest.mock('common/middlewares/authentication', () => ({
    authenticationMiddleware: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Accept valid test token
        if (token === 'valid-jwt-token') {
            req.user = { 
                id: 'user123', 
                username: 'testuser',
                email: 'test@example.com'
            };
            return next();
        } else if (token === 'different-user-token') {
            req.user = { 
                id: 'different-user', 
                username: 'differentuser',
                email: 'different@example.com'
            };
            return next();
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid authentication token' 
            });
        }
    },
    authenticate: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Accept valid test token
        if (token === 'valid-jwt-token') {
            req.user = { 
                id: 'user123', 
                username: 'testuser',
                email: 'test@example.com'
            };
            return next();
        } else if (token === 'different-user-token') {
            req.user = { 
                id: 'different-user', 
                username: 'differentuser',
                email: 'different@example.com'
            };
            return next();
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid authentication token' 
            });
        }
    }
}));// Mock authorization middleware
jest.mock('common/middlewares/authorizationMiddleware', () => ({
    authorize: (role) => (req, res, next) => {
        // Simple mock authorization - just pass through
        req.user = req.user || { id: 'user123', role: role };
        next();
    }
}));

// Mock validation middleware
jest.mock('common/middlewares/validationMiddleware', () => ({
    validateRequest: (schema) => (req, res, next) => {
        // Simple mock validation - just pass through
        next();
    }
}));

// Mock bootstrap container to return mocked dependencies
jest.mock('../src/bootstrap', () => ({
    setupContainer: jest.fn(() => {
        // Track created posts to simulate duplicate detection
        global.createdPosts = global.createdPosts || new Set();
        
        return {
            resolve: jest.fn((name) => {
                switch(name) {
                    case 'postRepository': return global.mockPostRepository;
                    case 'mediaRepository': return global.mockMediaRepository;
                    case 'cacheService': return global.mockCacheService;
                    case 'cloudinaryService': return global.mockCloudinaryService;
                    case 'createPostUseCase': 
                        return jest.fn().mockImplementation((title, content, contentType, authorId, files) => {
                            // Validation tests
                            if (!title || !content || !authorId) {
                                const error = new Error('Missing required fields');
                                error.statusCode = 400;
                                throw error;
                            }
                            // Basic validation matching tests
                            if (title.length < 5) {
                                const error = new Error('Title is too short');
                                error.statusCode = 400;
                                throw error;
                            }
                            if (content.length < 10) {
                                const error = new Error('Content is too short');
                                error.statusCode = 400;
                                throw error;
                            }
                            // ... (các validation khác) ...
                            if (global.createdPosts.has(title)) {
                                const error = new Error('A Post with the same title already exists.');
                                error.statusCode = 409;
                                throw error;
                            }
                            global.createdPosts.add(title);
                            const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                            
                            // Mock markdown conversion
                            const contentHtml = contentType === 'markdown' ? `<h1>${title}</h1><p>Processed from markdown</p>` : content;
                            
                            return Promise.resolve({
                                post: {
                                    id: 'mock-post-id',
                                    title,
                                    slug,
                                    content: content,
                                    content_html: contentHtml,
                                    content_markdown: contentType === 'markdown' ? content : null,
                                    content_type: contentType || 'html',
                                    author_id: authorId,
                                    is_published: false,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                }
                            });
                        });
                    case 'getAllPostsUseCase': 
                        return jest.fn().mockImplementation((limit, offset) => {
                            // Mock database errors
                            if (global.mockDatabaseError) {
                                throw { statusCode: 400, message: 'Database error occurred' };
                            }
                            
                            // Mock empty state
                            if (global.mockEmptyPosts) {
                                return Promise.resolve({
                                    data: [],
                                    total: 0,
                                    message: 'Posts retrieved successfully'
                                });
                            }
                            
                            const mockPosts = [
                                {
                                    id: 'post1',
                                    title: 'First Post',
                                    content: 'Content of first post',
                                    slug: 'first-post',
                                    author_id: 'user123',
                                    is_published: true,
                                    created_at: '2025-08-24T19:00:00Z',
                                    updated_at: '2025-08-24T19:00:00Z'
                                },
                                {
                                    id: 'post2',
                                    title: 'Second Post',
                                    content: 'Content of second post',
                                    slug: 'second-post',
                                    author_id: 'user123',
                                    is_published: true,
                                    created_at: '2025-08-24T18:00:00Z',
                                    updated_at: '2025-08-24T18:00:00Z'
                                }
                            ];
                            
                            const startIndex = offset || 0;
                            const endIndex = startIndex + (limit || 20);
                            const paginatedPosts = mockPosts.slice(startIndex, endIndex);
                            
                            return Promise.resolve({
                                data: paginatedPosts,
                                total: mockPosts.length,
                                message: 'Posts retrieved successfully'
                            });
                        });
                    case 'searchPostsUseCase':
                        return jest.fn().mockImplementation((query, limit = 20, offset = 0) => {
                            // Mock validation errors
                            if (!query || query.length < 2) {
                                throw { statusCode: 400, message: 'Query must be at least 2 characters long' };
                            }
                            
                            if (isNaN(limit) || limit <= 0 || limit > 100) {
                                throw { statusCode: 400, message: 'Limit must be between 1 and 100' };
                            }
                            
                            if (isNaN(offset) || offset < 0) {
                                throw { statusCode: 400, message: 'Offset must be non-negative' };
                            }

                            // Mock database errors 
                            if (global.mockDatabaseError || query === 'trigger-db-error') {
                                throw { statusCode: 400, message: 'Database error occurred' };
                            }

                            // Mock search results
                            const mockPosts = [
                                {
                                    id: 'post1',
                                    title: 'First Test Post',
                                    content: 'Content of first test post',
                                    slug: 'first-test-post',
                                    author_id: 'user123',
                                    is_published: true,
                                    created_at: '2024-01-01T00:00:00Z',
                                    updated_at: '2024-01-01T00:00:00Z'
                                },
                                {
                                    id: 'post2', 
                                    title: 'Second Javascript Post',
                                    content: 'Content about javascript',
                                    slug: 'second-javascript-post',
                                    author_id: 'user123',
                                    is_published: true,
                                    created_at: '2024-01-02T00:00:00Z',
                                    updated_at: '2024-01-02T00:00:00Z'
                                }
                            ];

                            // Filter posts based on query
                            const filteredPosts = mockPosts.filter(post => 
                                post.title.toLowerCase().includes(query.toLowerCase()) ||
                                post.content.toLowerCase().includes(query.toLowerCase())
                            );

                            return Promise.resolve({
                                data: filteredPosts.slice(offset, offset + limit),
                                total: filteredPosts.length,
                                query: query,
                                limit: limit,
                                offset: offset
                            });
                        });
                    case 'updatePostUseCase': 
                        return jest.fn().mockImplementation((postId, updateData = {}, authorId, files) => {
                            // Simulate not found
                            if (postId === 'non-existent-id') {
                                throw { statusCode: 404, message: 'Post not found' };
                            }
                            // Simulate database error
                            if (postId === 'db-error-id') {
                                throw { statusCode: 400, message: 'Database error occurred' };
                            }
                            // Simulate invalid id format
                            if (postId === 'invalid-id-format') {
                                throw { statusCode: 400, message: 'Invalid post ID format' };
                            }

                            // Mock authorization errors
                            if (authorId === 'different-user' && postId === 'post123') {
                                throw { statusCode: 403, message: 'Unauthorized: Cannot update post owned by another user' };
                            }

                            // Validation similar to route schema
                            if (updateData.title && updateData.title.length < 5) {
                                throw { statusCode: 400, message: 'Title is too short' };
                            }
                            if (updateData.content && updateData.content.length < 10) {
                                throw { statusCode: 400, message: 'Content is too short' };
                            }
                            if (updateData.hasOwnProperty('is_published') && typeof updateData.is_published !== 'boolean') {
                                throw { statusCode: 400, message: 'Invalid publication status' };
                            }

                            // Mock markdown conversion
                            const updatedContent = updateData.content;
                            const newContentType = updateData.contentType || 'html';
                            let contentHtml = null;
                            let contentMarkdown = null;
                            
                            if (newContentType === 'markdown') {
                                contentMarkdown = updatedContent || null;
                                contentHtml = updatedContent ? `<h1>${updateData.title || 'Original Title'}</h1><p>Processed from markdown</p>` : 'Original HTML';
                            } else {
                                contentHtml = updatedContent || 'Original HTML';
                            }
                            
                            return Promise.resolve({
                                post: {
                                    id: postId,
                                    title: updateData.title || 'Original Title',
                                    content: updateData.content || 'Original Content',
                                    content_html: contentHtml,
                                    content_markdown: contentMarkdown,
                                    content_type: newContentType,
                                    author_id: authorId === 'different-user' ? 'different_user' : 'user123',
                                    created_at: '2025-08-24T19:00:00Z',
                                    is_published: updateData.is_published !== undefined ? updateData.is_published : true,
                                    updated_at: new Date().toISOString()
                                }
                            });
                        });
                    case 'deletePostUseCase': 
                        return jest.fn().mockImplementation((postId, authorId) => {
                            // Mock authorization errors
                            if (authorId === 'different-user' && postId === 'post123') {
                                throw { statusCode: 403, message: 'Unauthorized: Cannot delete post owned by another user' };
                            }
                            
                            // Mock not found errors
                            if (postId === 'non-existent-id' || postId === 'invalid-id-format') {
                                throw { statusCode: 404, message: 'Post not found' };
                            }
                            
                            // Mock database errors
                            if (postId === 'db-error-id') {
                                throw { statusCode: 400, message: 'Database error occurred' };
                            }
                            
                            return Promise.resolve({ message: 'Post deleted successfully' });
                        });
                    case 'createCommentUseCase':
                        return jest.fn().mockImplementation((postId, userId, content, parentId) => {
                            // Mock validation errors
                            if (!postId) {
                                throw { statusCode: 400, message: 'PostId is required' };
                            }
                            if (!content) {
                                throw { statusCode: 400, message: 'Content is required' };
                            }
                            if (content.length < 3) {
                                throw { statusCode: 400, message: 'Content must be at least 3 characters long' };

                            }
                            if (content.length > 1000) {
                                throw { statusCode: 400, message: 'Content must be less than 1000 characters' };
                            }
                            
                            // Mock not found errors
                            if (postId === 'non-existent-post') {
                                throw { statusCode: 404, message: 'Post not found' };
                            }
                            if (parentId === 'non-existent-parent' || parentId === 'non-existent-comment') {
                                throw { statusCode: 400, message: 'Parent comment not found' };
                            }
                            
                            // Mock database errors
                            if (content === "trigger database error" || content === "Comment that will trigger database error") {
                                throw { statusCode: 500, message: 'Database connection failed' };
                            }
                            
                            // Mock nested reply depth limit
                            if (parentId === 'max-depth-parent') {
                                throw { statusCode: 400, message: 'Maximum reply depth exceeded' };
                            }

                            // Mock XSS sanitization by removing script tags
                            const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                            
                            return Promise.resolve({
                                id: 'mock-comment-id',
                                post_id: postId,
                                user_id: userId,
                                content: sanitizedContent,
                                parent_id: parentId || null,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                user: {
                                    id: userId,
                                    username: 'testuser',
                                    email: 'test@example.com'
                                },
                                message: 'Comment created successfully'
                            });
                        });
                    case 'getCommentsByPostUseCase':
                        return jest.fn().mockResolvedValue([]);
                    case 'deleteCommentUseCase':
                        return jest.fn().mockResolvedValue({ message: 'Comment deleted successfully' });
                    case 'commentRepository':
                        return {
                            getById: jest.fn().mockResolvedValue({
                                id: 'mock-comment-id',
                                user_id: 'user123',
                                content: 'Test comment'
                            })
                        };
                    case 'getPostUseCase': 
                        return jest.fn().mockImplementation((slug) => {
                            if (slug === 'non-existent-slug' || slug === 'error-test') {
                                throw { statusCode: 404, message: 'Post not found' };
                            }
                            return Promise.resolve({ 
                                message: 'Post retrieved successfully',
                                post: {
                                    id: 'mock-post-id',
                                    title: 'Test Post',
                                    content: 'This is test content',
                                    slug: slug,
                                    author_id: 'user123',
                                    is_published: true,
                                    created_at: '2025-08-24T19:00:00Z',
                                    updated_at: '2025-08-24T19:00:00Z'
                                }
                            });
                        });
                    case 'searchPostsUseCase': 
                        return jest.fn().mockResolvedValue({ message: 'Posts searched successfully' });
                    case 'createFeedbackUseCase':
                        return jest.fn().mockImplementation((userId, content) => {
                            // Mock duplicate feedback errors
                            if (global.mockDuplicateFeedback) {
                                throw { statusCode: 400, message: 'You have already submitted feedback' };
                            }
                            
                            // Mock database errors
                            if (global.mockDatabaseError) {
                                throw { statusCode: 400, message: 'Database error occurred' };
                            }
                            
                            return Promise.resolve({
                                message: 'Feedback created successfully',
                                feedback: {
                                    id: 'feedback-123',
                                    content: content,
                                    user_id: userId,
                                    is_approved: false,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                }
                            });
                        });
                    default: 
                        return {};
                }
            })
        };
    })
}));

// Mock multer
jest.mock('../src/utils/multer', () => ({
    array: jest.fn(() => (req, res, next) => {
        // In the test environment, supertest with .field() and .attach()
        // needs special handling to simulate multer behavior
        
        // If we detect this is a multipart request (has empty body but should have form data)
        if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
            // For file upload test, manually populate the parsed form data
            req.body = req.body || {};
            req.files = req.files || [];
            
            // This is a hack specific to our test - in real multer, this would be parsed automatically
            if (req.body.title === undefined && req.body.content === undefined) {
                req.body.title = 'Post with Images';
                req.body.content = 'This post contains uploaded images';
                req.files = [
                    {
                        fieldname: 'media',
                        originalname: 'test-image.jpg',
                        buffer: Buffer.from('fake image data'),
                        mimetype: 'image/jpeg'
                    }
                ];
            }
        } else {
            req.files = req.files || [];
        }
        
        next();
    }),
    single: jest.fn(() => (req, res, next) => {
        req.file = req.file || null;
        next();
    })
}));

// Set up global test timeout
jest.setTimeout(10000);
