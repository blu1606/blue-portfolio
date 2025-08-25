// __tests__/api/getAllPosts.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/v1/posts - Get All Posts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Public Access Tests', () => {
        it('should return all posts without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/posts');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Posts retrieved successfully!');
            expect(response.body.metadata).toHaveProperty('posts');
            expect(response.body.metadata).toHaveProperty('total');
            expect(Array.isArray(response.body.metadata.posts)).toBe(true);
        });

        it('should return empty array when no posts exist', async () => {
            // Mock empty database
            global.mockEmptyPosts = true;

            const response = await request(app)
                .get('/api/v1/posts');

            expect(response.status).toBe(200);
            expect(response.body.metadata.posts).toEqual([]);
            expect(response.body.metadata.total).toBe(0);
            
            // Reset mock
            global.mockEmptyPosts = false;
        });
    });

    describe('Pagination Tests', () => {
        it('should handle pagination with limit parameter', async () => {
            const response = await request(app)
                .get('/api/v1/posts?limit=5');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle pagination with offset parameter', async () => {
            const response = await request(app)
                .get('/api/v1/posts?offset=10');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle pagination with both limit and offset', async () => {
            const response = await request(app)
                .get('/api/v1/posts?limit=5&offset=10');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject invalid limit values', async () => {
            const response = await request(app)
                .get('/api/v1/posts?limit=0');

            expect(response.status).toBe(400);
        });

        it('should reject limit values that are too large', async () => {
            const response = await request(app)
                .get('/api/v1/posts?limit=101');

            expect(response.status).toBe(400);
        });

        it('should reject negative offset values', async () => {
            const response = await request(app)
                .get('/api/v1/posts?offset=-1');

            expect(response.status).toBe(400);
        });

        it('should use default pagination when no parameters provided', async () => {
            const response = await request(app)
                .get('/api/v1/posts');

            expect(response.status).toBe(200);
            // Should use default limit of 20 and offset of 0
        });
    });

    describe('Response Format Tests', () => {
        it('should return posts with correct structure', async () => {
            const response = await request(app)
                .get('/api/v1/posts');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.metadata).toHaveProperty('posts');
            expect(response.body.metadata).toHaveProperty('total');
            
            if (response.body.metadata.posts.length > 0) {
                const post = response.body.metadata.posts[0];
                expect(post).toHaveProperty('id');
                expect(post).toHaveProperty('title');
                expect(post).toHaveProperty('slug');
                expect(post).toHaveProperty('created_at');
                expect(post).toHaveProperty('is_published');
            }
        });

        it('should order posts by creation date (newest first)', async () => {
            const response = await request(app)
                .get('/api/v1/posts');

            expect(response.status).toBe(200);
            
            const posts = response.body.metadata.posts;
            if (posts.length > 1) {
                for (let i = 0; i < posts.length - 1; i++) {
                    const currentDate = new Date(posts[i].created_at);
                    const nextDate = new Date(posts[i + 1].created_at);
                    expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
                }
            }
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle database errors gracefully', async () => {
            // Mock database error
            global.mockDatabaseError = true;

            const response = await request(app)
                .get('/api/v1/posts');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            
            // Reset mock
            global.mockDatabaseError = false;
        });

        it('should validate query parameters', async () => {
            const response = await request(app)
                .get('/api/v1/posts?limit=invalid');

            expect(response.status).toBe(400);
        });

        it('should handle non-numeric pagination parameters', async () => {
            const response = await request(app)
                .get('/api/v1/posts?offset=abc');

            expect(response.status).toBe(400);
        });
    });

    describe('Performance Tests', () => {
        it('should return response within reasonable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/v1/posts');

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });
    });
});
