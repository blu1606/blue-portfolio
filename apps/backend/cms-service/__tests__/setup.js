// __tests__/setup.js
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock Supabase database
const createMockSupabase = () => {
    const mockPosts = [
        {
            id: 'post123',
            title: 'Test Post',
            slug: 'test-post',
            content: 'This is a test post content',
            author_id: 'user123',
            created_at: '2025-08-25T10:00:00Z',
            updated_at: '2025-08-25T10:00:00Z',
            is_published: true
        },
        {
            id: 'post456',
            title: 'Another Test Post',
            slug: 'another-test-post',
            content: 'Another test post content',
            author_id: 'user123',
            created_at: '2025-08-25T11:00:00Z',
            updated_at: '2025-08-25T11:00:00Z',
            is_published: false
        }
    ];

    const mockComments = [
        {
            id: 'comment123',
            post_id: 'post123',
            user_id: 'user123',
            content: 'Test comment',
            parent_id: null,
            created_at: '2025-08-25T12:00:00Z'
        }
    ];

    const mockFeedback = [
        {
            id: 'feedback123',
            user_id: 'user123',
            content: 'Test feedback',
            is_approved: true,
            created_at: '2025-08-25T13:00:00Z'
        }
    ];

    const mockMedia = [
        {
            id: 'media123',
            post_id: 'post123',
            type: 'image',
            url: 'https://test.cloudinary.com/image.jpg',
            public_id: 'test_public_id',
            alt_text: 'Test image'
        }
    ];

    return {
        from: jest.fn((table) => {
            const mockData = {
                posts: mockPosts,
                comments: mockComments,
                feedback: mockFeedback,
                media: mockMedia
            };

            return {
                select: jest.fn((columns = '*') => ({
                    eq: jest.fn((column, value) => {
                        const tableData = mockData[table] || [];
                        const filteredData = tableData.filter(item => item[column] === value);
                        
                        return {
                            single: jest.fn(() => {
                                if (filteredData.length === 0) {
                                    return Promise.resolve({ 
                                        data: null, 
                                        error: { code: 'PGRST116', message: 'Not found' }
                                    });
                                }
                                return Promise.resolve({ data: filteredData[0], error: null });
                            }),
                            then: jest.fn((callback) => {
                                return callback({ data: filteredData, error: null });
                            })
                        };
                    }),
                    order: jest.fn(() => ({
                        range: jest.fn(() => ({
                            then: jest.fn((callback) => {
                                const tableData = mockData[table] || [];
                                return callback({ data: tableData, error: null });
                            })
                        })),
                        then: jest.fn((callback) => {
                            const tableData = mockData[table] || [];
                            return callback({ data: tableData, error: null });
                        })
                    })),
                    or: jest.fn(() => ({
                        limit: jest.fn(() => ({
                            offset: jest.fn(() => ({
                                then: jest.fn((callback) => {
                                    const tableData = mockData[table] || [];
                                    return callback({ data: tableData, error: null });
                                })
                            }))
                        })),
                        then: jest.fn((callback) => {
                            const tableData = mockData[table] || [];
                            return callback({ data: tableData, error: null });
                        })
                    })),
                    then: jest.fn((callback) => {
                        const tableData = mockData[table] || [];
                        return callback({ data: tableData, error: null });
                    })
                })),
                insert: jest.fn((data) => ({
                    select: jest.fn(() => ({
                        single: jest.fn(() => {
                            const newItem = Array.isArray(data) ? data[0] : data;
                            const itemWithId = { 
                                id: `generated_id_${Date.now()}`, 
                                ...newItem,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };
                            return Promise.resolve({ data: itemWithId, error: null });
                        }),
                        then: jest.fn((callback) => {
                            const newItem = Array.isArray(data) ? data[0] : data;
                            const itemWithId = { id: `generated_id_${Date.now()}`, ...newItem };
                            return callback({ data: itemWithId, error: null });
                        })
                    }))
                })),
                update: jest.fn((data) => ({
                    eq: jest.fn(() => ({
                        select: jest.fn(() => ({
                            single: jest.fn(() => {
                                const updatedItem = { id: 'updated_id', ...data };
                                return Promise.resolve({ data: updatedItem, error: null });
                            })
                        }))
                    }))
                })),
                delete: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        select: jest.fn(() => ({
                            then: jest.fn((callback) => {
                                return callback({ data: [{ id: 'deleted_id' }], error: null });
                            })
                        }))
                    }))
                }))
            };
        })
    };
};

// Mock Supabase
jest.mock('../src/db/initSupabase', () => createMockSupabase());

// Mock Cloudinary service
jest.mock('../src/services/cloudinaryService', () => ({
    createCloudinaryService: () => ({
        uploadFile: jest.fn().mockResolvedValue({
            publicId: 'test_public_id',
            url: 'https://test.cloudinary.com/image.jpg',
            width: 1920,
            height: 1080,
            format: 'jpg',
            resourceType: 'image'
        }),
        deleteFile: jest.fn().mockResolvedValue({ result: 'ok' }),
        generateTransformUrl: jest.fn().mockReturnValue('https://test.cloudinary.com/transformed.jpg')
    })
}));

// Mock cache service
jest.mock('../src/services/cacheService', () => ({
    createCacheService: () => ({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        setex: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1)
    })
}));

// Mock common response classes
jest.mock('common/core/success.response.js', () => ({
    SuccessResponse: class MockSuccessResponse {
        constructor({ message, metadata }) {
            this.message = message;
            this.metadata = metadata;
        }
        send(res) {
            res.status(200).json({
                success: true,
                message: this.message,
                metadata: this.metadata
            });
        }
    },
    CREATED: class MockCreatedResponse {
        constructor({ message, metadata }) {
            this.message = message;
            this.metadata = metadata;
        }
        send(res) {
            res.status(201).json({
                success: true,
                message: this.message,
                metadata: this.metadata
            });
        }
    }
}));

// Mock common error classes
jest.mock('common/core/error.response', () => ({
    BadRequestError: class MockBadRequestError extends Error {
        constructor(message) {
            super(message);
            this.statusCode = 400;
        }
    },
    NotFoundError: class MockNotFoundError extends Error {
        constructor(message) {
            super(message);
            this.statusCode = 404;
        }
    },
    ConflictRequestError: class MockConflictRequestError extends Error {
        constructor(message) {
            super(message);
            this.statusCode = 409;
        }
    },
    InternalServerError: class MockInternalServerError extends Error {
        constructor(message) {
            super(message);
            this.statusCode = 500;
        }
    }
}));

// Mock slugify
jest.mock('slugify', () => jest.fn((text) => text.toLowerCase().replace(/\s+/g, '-')));

module.exports = {
    createMockSupabase
};
