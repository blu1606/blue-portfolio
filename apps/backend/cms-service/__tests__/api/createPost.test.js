// __tests__/api/createPost.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/posts - Create Post', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear the global created posts tracker
        global.createdPosts = new Set();
    });

    describe('Authentication Required', () => {
        it('should return 401 when no authorization header is provided', async () => {
            const postData = {
                title: 'Test Post',
                content: 'This is a test post content'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .send(postData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 when invalid token is provided', async () => {
            const postData = {
                title: 'Test Post',
                content: 'This is a test post content'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer invalid-token')
                .send(postData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Validation Tests', () => {
        it('should return 400 when title is missing', async () => {
            const postData = {
                content: 'This is a test post content'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(400);
        });

        it('should return 400 when content is missing', async () => {
            const postData = {
                title: 'Test Post'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(400);
        });

        it('should return 400 when title is too short', async () => {
            const postData = {
                title: 'Hi',
                content: 'This is a test post content'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(400);
        });

        it('should return 400 when content is too short', async () => {
            const postData = {
                title: 'Test Post Title',
                content: 'Short'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(400);
        });
    });

    describe('Successful Post Creation', () => {
        it('should create a post successfully with valid data', async () => {
            const postData = {
                title: 'Test Post Title',
                content: 'This is a comprehensive test post content that meets minimum length requirements'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Post created successfully');
            expect(response.body.metadata).toHaveProperty('id');
            expect(response.body.metadata).toHaveProperty('title', postData.title);
            expect(response.body.metadata).toHaveProperty('slug', 'test-post-title');
            expect(response.body.metadata).toHaveProperty('content', postData.content);
            expect(response.body.metadata).toHaveProperty('author_id', 'user123');
            expect(response.body.metadata).toHaveProperty('is_published', false);
        });

        it('should handle file uploads when creating a post', async () => {
            const postData = {
                title: 'Post with Images',
                content: 'This post contains uploaded images'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .field('title', postData.title)
                .field('content', postData.content)
                .attach('media', Buffer.from('fake image data'), 'test-image.jpg');

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.metadata).toHaveProperty('title', postData.title);
        });
    });

    describe('Business Logic Tests', () => {
        it('should return 409 when creating a post with duplicate slug', async () => {
            // First, create a post
            const postData = {
                title: 'Unique Post Title',
                content: 'This is a test post content with sufficient length'
            };

            await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            // Try to create another post with the same title (which generates same slug)
            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('A Post with the same title already exists.');
        });

        it('should generate correct slug from title', async () => {
            const postData = {
                title: 'This Is A Test Post With Special Characters!@#',
                content: 'Content for the special characters test post'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.slug).toBe('this-is-a-test-post-with-special-characters');
        });

        it('should set post as draft by default', async () => {
            const postData = {
                title: 'Draft Post Test',
                content: 'This post should be created as a draft by default'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.is_published).toBe(false);
        });

        it('should set correct timestamps when creating post', async () => {
            const postData = {
                title: 'Timestamp Test Post',
                content: 'Testing if timestamps are set correctly'
            };

            const response = await request(app)
                .post('/api/v1/posts')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(postData);

            expect(response.status).toBe(201);
            expect(response.body.metadata).toHaveProperty('created_at');
            expect(response.body.metadata).toHaveProperty('updated_at');
            
            const createdAt = new Date(response.body.metadata.created_at);
            const updatedAt = new Date(response.body.metadata.updated_at);
            
            expect(createdAt).toBeInstanceOf(Date);
            expect(updatedAt).toBeInstanceOf(Date);
        });
    });
});
