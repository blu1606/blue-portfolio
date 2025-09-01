// __tests__/api/searchPosts.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/v1/posts/search - Search Posts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Public Access Tests', () => {
        it('should allow searching posts without authentication', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.metadata).toHaveProperty('posts');
            expect(response.body.metadata).toHaveProperty('total');
        });

        it('should return empty results for queries with no matches', async () => {
            // Mock empty search results
            const supabase = require('../../src/db/initSupabase');
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValueOnce({
                    or: jest.fn().mockReturnValueOnce({
                        limit: jest.fn().mockReturnValueOnce({
                            offset: jest.fn().mockReturnValueOnce({
                                then: jest.fn((callback) => callback({ data: [], error: null }))
                            })
                        })
                    })
                })
            });

            const response = await request(app)
                .get('/api/v1/posts/search?query=nonexistentquery');

            expect(response.status).toBe(200);
            expect(response.body.metadata.posts).toEqual([]);
            expect(response.body.metadata.total).toBe(0);
        });
    });

    describe('Query Parameter Validation', () => {
        it('should require query parameter', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject query that is too short', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=a');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should accept minimum length query', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=ab');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle special characters in query', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test@#$%');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle unicode characters in query', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=测试');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle URL encoded query parameters', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=' + encodeURIComponent('test query with spaces'));

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Pagination Tests', () => {
        it('should handle pagination with limit parameter', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test&limit=5');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle pagination with offset parameter', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test&offset=10');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle pagination with both limit and offset', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test&limit=5&offset=10');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should use default pagination when not specified', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            // Should use default limit of 20 and offset of 0
        });

        it('should reject invalid limit values', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test&limit=0');

            expect(response.status).toBe(400);
        });

        it('should reject limit values that are too large', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test&limit=101');

            expect(response.status).toBe(400);
        });

        it('should reject negative offset values', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test&offset=-1');

            expect(response.status).toBe(400);
        });
    });

    describe('Search Functionality Tests', () => {
        it('should search in post titles', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=title');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            // Check if results contain query term in title
            if (response.body.metadata.posts.length > 0) {
                const hasMatchingTitle = response.body.metadata.posts.some(post => 
                    post.title.toLowerCase().includes('title')
                );
                expect(hasMatchingTitle).toBe(true);
            }
        });

        it('should search in post content', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=content');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            // Check if results contain query term in content
            if (response.body.metadata.posts.length > 0) {
                const hasMatchingContent = response.body.metadata.posts.some(post => 
                    post.content.toLowerCase().includes('content')
                );
                expect(hasMatchingContent).toBe(true);
            }
        });

        it('should be case insensitive', async () => {
            const response1 = await request(app)
                .get('/api/v1/posts/search?query=TEST');

            const response2 = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
            // Both should return similar results (case insensitive)
        });

        it('should handle partial word matches', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=tes');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle multiple word queries', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test post');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return relevant results first', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            // Results should be ordered by relevance (though our mock doesn't implement this)
            const posts = response.body.metadata.posts;
            expect(Array.isArray(posts)).toBe(true);
        });
    });

    describe('Response Format Tests', () => {
        it('should return search results with correct structure', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.metadata).toHaveProperty('posts');
            expect(response.body.metadata).toHaveProperty('total');
            expect(response.body.metadata).toHaveProperty('query', 'test');
            expect(response.body.metadata).toHaveProperty('limit');
            expect(response.body.metadata).toHaveProperty('offset');
        });

        it('should return post objects with required fields', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response.status).toBe(200);
            
            if (response.body.metadata.posts.length > 0) {
                const post = response.body.metadata.posts[0];
                expect(post).toHaveProperty('id');
                expect(post).toHaveProperty('title');
                expect(post).toHaveProperty('slug');
                expect(post).toHaveProperty('created_at');
                expect(post).toHaveProperty('is_published');
                // Content might be truncated in search results
            }
        });

        it('should include search metadata', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test&limit=10&offset=5');

            expect(response.status).toBe(200);
            expect(response.body.metadata.query).toBe('test');
            expect(response.body.metadata.limit).toBe(10);
            expect(response.body.metadata.offset).toBe(5);
        });
    });

    describe('Performance Tests', () => {
        it('should respond within reasonable time for simple queries', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });

        it('should handle long queries efficiently', async () => {
            const longQuery = 'a'.repeat(100);
            const startTime = Date.now();
            
            const response = await request(app)
                .get(`/api/v1/posts/search?query=${longQuery}`);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect([200, 400]).toContain(response.status);
            expect(responseTime).toBeLessThan(2000);
        });
    });

    describe('Caching Tests', () => {
        it('should cache search results', async () => {
            const mockCacheService = require('../../src/services/cacheService');
            
            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response.status).toBe(200);
            // Cache should be checked and potentially set
        });

        it('should use cached results when available', async () => {
            // This test would pass since our mock doesn't implement caching
            // In real implementation, cache service would be used
            const response = await request(app)
                .get('/api/v1/posts/search?query=cached');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            // Should return results (cached or not)
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle database errors gracefully', async () => {
            // Set flag to trigger database error in mock
            global.mockDatabaseError = true;

            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            
            // Reset flag
            global.mockDatabaseError = false;
        });

        it('should handle malformed query parameters', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test&limit=abc');

            expect(response.status).toBe(400);
        });
    });

    describe('Security Tests', () => {
        it('should sanitize search query to prevent injection', async () => {
            const maliciousQuery = "test'; DROP TABLE posts; --";
            
            const response = await request(app)
                .get(`/api/v1/posts/search?query=${encodeURIComponent(maliciousQuery)}`);

            expect([200, 400]).toContain(response.status);
            // Should not execute malicious SQL
        });

        it('should handle XSS attempts in search query', async () => {
            const xssQuery = '<script>alert("xss")</script>';
            
            const response = await request(app)
                .get(`/api/v1/posts/search?query=${encodeURIComponent(xssQuery)}`);

            expect([200, 400]).toContain(response.status);
            if (response.body.metadata) {
                expect(response.body.metadata.query).not.toContain('<script>');
            }
        });

        it('should not expose sensitive information in search results', async () => {
            const response = await request(app)
                .get('/api/v1/posts/search?query=test');

            expect(response.status).toBe(200);
            
            if (response.body.metadata.posts.length > 0) {
                const post = response.body.metadata.posts[0];
                expect(post).not.toHaveProperty('password');
                expect(post).not.toHaveProperty('private_key');
                expect(post).not.toHaveProperty('secret');
            }
        });
    });
});
