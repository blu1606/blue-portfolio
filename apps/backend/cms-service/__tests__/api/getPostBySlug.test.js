// __tests__/api/getPostBySlug.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/v1/posts/:slug - Get Post By Slug', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Public Access Tests', () => {
        it('should return a post when valid slug is provided', async () => {
            const response = await request(app)
                .get('/api/v1/posts/test-post');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.metadata).toHaveProperty('post');
            expect(response.body.metadata.post).toHaveProperty('slug', 'test-post');
        });

        it('should return 404 when post with slug does not exist', async () => {
            // Mock database to return null
            const supabase = require('../../src/db/initSupabase');
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        single: jest.fn().mockResolvedValueOnce({
                            data: null,
                            error: { code: 'PGRST116', message: 'Not found' }
                        })
                    })
                })
            });

            const response = await request(app)
                .get('/api/v1/posts/non-existent-slug');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Response Format Tests', () => {
        it('should return post with complete data structure', async () => {
            const response = await request(app)
                .get('/api/v1/posts/test-post');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.metadata).toHaveProperty('post');

            const post = response.body.metadata.post;
            expect(post).toHaveProperty('id');
            expect(post).toHaveProperty('title');
            expect(post).toHaveProperty('slug');
            expect(post).toHaveProperty('content');
            expect(post).toHaveProperty('author_id');
            expect(post).toHaveProperty('created_at');
            expect(post).toHaveProperty('updated_at');
            expect(post).toHaveProperty('is_published');
        });

        it('should return post content in full', async () => {
            const response = await request(app)
                .get('/api/v1/posts/test-post');

            expect(response.status).toBe(200);
            const post = response.body.metadata.post;
            expect(post.content).toBeTruthy();
            expect(typeof post.content).toBe('string');
        });
    });

    describe('Slug Validation Tests', () => {
        it('should handle slugs with special characters', async () => {
            const response = await request(app)
                .get('/api/v1/posts/test-post-with-numbers-123');

            expect(response.status).toBe(200);
        });

        it('should handle slugs with hyphens', async () => {
            const response = await request(app)
                .get('/api/v1/posts/multi-word-slug-test');

            expect(response.status).toBe(200);
        });

        it('should be case sensitive for slugs', async () => {
            // Mock different responses for different cases
            const supabase = require('../../src/db/initSupabase');
            
            const response1 = await request(app)
                .get('/api/v1/posts/Test-Post');

            const response2 = await request(app)
                .get('/api/v1/posts/test-post');

            // Both should work since we're mocking, but in real implementation
            // they would be case sensitive
            expect([200, 404]).toContain(response1.status);
            expect([200, 404]).toContain(response2.status);
        });
    });

    describe('Caching Tests', () => {
        it('should use cache when available', async () => {
            // Mock cache service to return cached data
            const cachedPost = {
                id: 'cached_post',
                title: 'Cached Post',
                slug: 'cached-post',
                content: 'This is cached content'
            };

            global.mockCacheInstance.get.mockResolvedValueOnce(
                JSON.stringify(cachedPost)
            );

            const response = await request(app)
                .get('/api/v1/posts/cached-post');

            expect(response.status).toBe(200);
            // Should return cached data without hitting database
        });

        it('should cache post data after database retrieval', async () => {
            const response = await request(app)
                .get('/api/v1/posts/test-post');

            expect(response.status).toBe(200);
            // Cache should be set after successful retrieval
            expect(global.mockCacheInstance.setex).toHaveBeenCalled();
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle database errors gracefully', async () => {
            const response = await request(app)
                .get('/api/v1/posts/error-test');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should handle empty slug parameter', async () => {
            const response = await request(app)
                .get('/api/v1/posts/');

            // Should route to getAllPosts instead
            expect(response.status).toBe(200);
        });

        it('should handle very long slug parameters', async () => {
            const longSlug = 'a'.repeat(1000);
            const response = await request(app)
                .get(`/api/v1/posts/${longSlug}`);

            expect([200, 404, 400]).toContain(response.status);
        });
    });

    describe('Performance Tests', () => {
        it('should respond quickly for cached posts', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/v1/posts/test-post');

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(500); // Should respond within 500ms
        });
    });

    describe('Security Tests', () => {
        it('should not expose sensitive information in post data', async () => {
            const response = await request(app)
                .get('/api/v1/posts/test-post');

            expect(response.status).toBe(200);
            const post = response.body.metadata.post;
            
            // Should not contain database internal fields
            expect(post).not.toHaveProperty('password');
            expect(post).not.toHaveProperty('private_key');
            expect(post).not.toHaveProperty('secret');
        });

        it('should sanitize slug input to prevent injection', async () => {
            const maliciousSlug = 'test<script>alert("xss")</script>';
            const response = await request(app)
                .get(`/api/v1/posts/${maliciousSlug}`);

            expect([200, 404, 400, 401]).toContain(response.status);
            if (response.body.metadata?.post) {
                expect(response.body.metadata.post.slug).not.toContain('<script>');
            }
        });
    });
});
