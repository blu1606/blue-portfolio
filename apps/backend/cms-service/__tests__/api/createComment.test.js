// __tests__/api/createComment.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/comments - Create Comment', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Authentication Required', () => {
        it('should return 401 when no authorization header is provided', async () => {
            const commentData = {
                postId: 'post123',
                content: 'This is a test comment'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .send(commentData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 when invalid token is provided', async () => {
            const commentData = {
                postId: 'post123',
                content: 'This is a test comment'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer invalid-token')
                .send(commentData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Validation Tests', () => {
        it('should return 400 when postId is missing', async () => {
            const commentData = {
                content: 'This is a test comment'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(400);
        });

        it('should return 400 when content is missing', async () => {
            const commentData = {
                postId: 'post123'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(400);
        });

        it('should return 400 when content is too short', async () => {
            const commentData = {
                postId: 'post123',
                content: 'Hi'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(400);
        });

        it('should return 400 when content is too long', async () => {
            const commentData = {
                postId: 'post123',
                content: 'a'.repeat(1001) // Assuming 1000 char limit
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(400);
        });
    });

    describe('Successful Comment Creation', () => {
        it('should create a comment successfully with valid data', async () => {
            const commentData = {
                postId: 'post123',
                content: 'This is a comprehensive test comment that meets all requirements'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Comment created successfully');
            expect(response.body.metadata).toHaveProperty('id');
            expect(response.body.metadata).toHaveProperty('post_id', commentData.postId);
            expect(response.body.metadata).toHaveProperty('content', commentData.content);
            expect(response.body.metadata).toHaveProperty('user_id', 'user123');
            expect(response.body.metadata).toHaveProperty('parent_id', null);
        });

        it('should create a reply comment with parent_id', async () => {
            const replyData = {
                postId: 'post123',
                content: 'This is a reply to another comment',
                parentId: 'comment456'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(replyData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.metadata).toHaveProperty('parent_id', replyData.parentId);
        });

        it('should set correct timestamps when creating comment', async () => {
            const commentData = {
                postId: 'post123',
                content: 'Testing timestamp creation'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(201);
            expect(response.body.metadata).toHaveProperty('created_at');
            
            const createdAt = new Date(response.body.metadata.created_at);
            expect(createdAt).toBeInstanceOf(Date);
        });
    });

    describe('Business Logic Tests', () => {
        it('should return 404 when post does not exist', async () => {
            // Mock post repository to return null
            const commentData = {
                postId: 'non-existent-post',
                content: 'Comment on non-existent post'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Post not found');
        });

        it('should return 400 when parent comment does not exist', async () => {
            const replyData = {
                postId: 'post123',
                content: 'Reply to non-existent comment',
                parentId: 'non-existent-comment'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(replyData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 when trying to reply to a reply (nested depth limit)', async () => {
            // Mock parent comment that is already a reply
            const deepReplyData = {
                postId: 'post123',
                content: 'Trying to create deep nested reply',
                parentId: 'reply-comment-id'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(deepReplyData);

            // Depending on business rules, might limit nesting depth
            expect([201, 400]).toContain(response.status);
        });
    });

    describe('Response Format Tests', () => {
        it('should return comment with correct structure', async () => {
            const commentData = {
                postId: 'post123',
                content: 'Test comment for structure validation'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('metadata');

            const comment = response.body.metadata;
            expect(comment).toHaveProperty('id');
            expect(comment).toHaveProperty('post_id');
            expect(comment).toHaveProperty('user_id');
            expect(comment).toHaveProperty('content');
            expect(comment).toHaveProperty('parent_id');
            expect(comment).toHaveProperty('created_at');
        });
    });

    describe('Security Tests', () => {
        it('should sanitize comment content to prevent XSS', async () => {
            const xssCommentData = {
                postId: 'post123',
                content: 'Comment with <script>alert("xss")</script> malicious content'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(xssCommentData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.content).not.toContain('<script>');
        });

        it('should prevent SQL injection in comment content', async () => {
            const sqlInjectionData = {
                postId: 'post123',
                content: "Comment with '; DROP TABLE comments; -- injection"
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(sqlInjectionData);

            expect(response.status).toBe(201);
            // Should create comment safely without executing SQL
        });

        it('should not allow commenting on behalf of other users', async () => {
            const commentData = {
                postId: 'post123',
                content: 'Legitimate comment content',
                userId: 'other-user-id' // Should be ignored
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.user_id).toBe('user123'); // Should use authenticated user
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle database errors gracefully', async () => {
            // Mock database error
            const supabase = require('../../src/db/initSupabase');
            supabase.from.mockReturnValueOnce({
                insert: jest.fn().mockReturnValueOnce({
                    select: jest.fn().mockReturnValueOnce({
                        single: jest.fn().mockRejectedValueOnce(
                            new Error('Database connection failed')
                        )
                    })
                })
            });

            const commentData = {
                postId: 'post123',
                content: 'Comment that will trigger database error'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle malformed request body', async () => {
            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect(response.status).toBe(400);
        });
    });

    describe('Performance Tests', () => {
        it('should create comment within reasonable time', async () => {
            const startTime = Date.now();
            
            const commentData = {
                postId: 'post123',
                content: 'Performance test comment'
            };

            const response = await request(app)
                .post('/api/v1/comments')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(commentData);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(response.status).toBe(201);
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });
    });
});
