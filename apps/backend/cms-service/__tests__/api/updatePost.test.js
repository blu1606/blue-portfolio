// __tests__/api/updatePost.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('PUT /api/v1/posts/:postId - Update Post', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Authentication Required', () => {
        it('should return 401 when no authorization header is provided', async () => {
            const updateData = {
                title: 'Updated Title',
                content: 'Updated content'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .send(updateData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 when invalid token is provided', async () => {
            const updateData = {
                title: 'Updated Title',
                content: 'Updated content'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer invalid-token')
                .send(updateData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Authorization Tests', () => {
        it('should allow author to update their own post', async () => {
            const updateData = {
                title: 'Updated Title',
                content: 'Updated content with sufficient length'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('updated successfully');
        });

        it('should return 403 when user tries to update post they do not own', async () => {
            // Mock database to return post with different author
            const supabase = require('../../src/db/initSupabase');
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        single: jest.fn().mockResolvedValueOnce({
                            data: {
                                id: 'post123',
                                author_id: 'different_user',
                                title: 'Original Title'
                            },
                            error: null
                        })
                    })
                })
            });

            const updateData = {
                title: 'Unauthorized Update'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer different-user-token')
                .send(updateData);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should return 404 when post does not exist', async () => {
            // Mock database to return null
            const supabase = require('../../src/db/initSupabase');
            supabase.from.mockReturnValueOnce({
                select: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        single: jest.fn().mockResolvedValueOnce({
                            data: null,
                            error: { code: 'PGRST116' }
                        })
                    })
                })
            });

            const updateData = {
                title: 'Update Non-existent Post'
            };

            const response = await request(app)
                .put('/api/v1/posts/non-existent-id')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Validation Tests', () => {
        it('should accept partial updates (title only)', async () => {
            const updateData = {
                title: 'Only Title Updated'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should accept partial updates (content only)', async () => {
            const updateData = {
                content: 'Only content updated with sufficient length for validation'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should accept publication status updates', async () => {
            const updateData = {
                is_published: true
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject title that is too short', async () => {
            const updateData = {
                title: 'Hi'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(400);
        });

        it('should reject content that is too short', async () => {
            const updateData = {
                content: 'Short'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(400);
        });

        it('should reject invalid publication status', async () => {
            const updateData = {
                is_published: 'invalid_boolean'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(400);
        });

        it('should accept empty update object', async () => {
            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send({});

            expect(response.status).toBe(200);
        });
    });

    describe('Business Logic Tests', () => {
        it('should update updated_at timestamp', async () => {
            const updateData = {
                title: 'Title with Timestamp Update',
                content: 'Content that should update the timestamp'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.metadata.post).toHaveProperty('updated_at');
            
            const updatedAt = new Date(response.body.metadata.post.updated_at);
            expect(updatedAt).toBeInstanceOf(Date);
        });

        it('should preserve unchanged fields', async () => {
            const updateData = {
                title: 'Only Title Changed'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.metadata.post).toHaveProperty('content'); // Should preserve original content
            expect(response.body.metadata.post).toHaveProperty('created_at'); // Should preserve creation date
        });

        it('should invalidate cache after successful update', async () => {
            const updateData = {
                title: 'Cache Invalidation Test'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            // Cache should be invalidated
            expect(global.mockCacheInstance.del).toHaveBeenCalled();
        });

        it('should handle slug regeneration when title changes', async () => {
            const updateData = {
                title: 'New Title For Slug Generation'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            // Note: This depends on whether the update logic regenerates slug
            // In many CMS systems, slug is not auto-updated to preserve URLs
        });
    });

    describe('Response Format Tests', () => {
        it('should return updated post with correct structure', async () => {
            const updateData = {
                title: 'Updated Post Title',
                content: 'Updated post content with sufficient length'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.metadata).toHaveProperty('post');

            const post = response.body.metadata.post;
            expect(post).toHaveProperty('id');
            expect(post).toHaveProperty('title', updateData.title);
            expect(post).toHaveProperty('content', updateData.content);
            expect(post).toHaveProperty('updated_at');
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle database errors gracefully', async () => {
            const updateData = {
                title: 'Database Error Test'
            };

            const response = await request(app)
                .put('/api/v1/posts/db-error-id')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle invalid post ID format', async () => {
            const updateData = {
                title: 'Valid Update Data'
            };

            const response = await request(app)
                .put('/api/v1/posts/invalid-id-format')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect([400, 404]).toContain(response.status);
        });
    });

    describe('Security Tests', () => {
        it('should not allow updating author_id field', async () => {
            const updateData = {
                title: 'Legitimate Update',
                author_id: 'malicious_user_id'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            // author_id should not be changed even if provided in request
            expect(response.body.metadata.post.author_id).toBe('user123');
        });

        it('should not allow updating created_at field', async () => {
            const updateData = {
                title: 'Legitimate Update',
                created_at: '2020-01-01T00:00:00Z'
            };

            const response = await request(app)
                .put('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(updateData);

            expect(response.status).toBe(200);
            // created_at should not be changed
            expect(response.body.metadata.post.created_at).not.toBe('2020-01-01T00:00:00Z');
        });
    });
});
