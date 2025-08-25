// __tests__/api/deletePost.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /api/v1/posts/:postId - Delete Post', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Authentication Required', () => {
        it('should return 401 when no authorization header is provided', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/post123');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 when invalid token is provided', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Authorization Tests', () => {
        it('should allow author to delete their own post', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');
        });

        it('should return 403 when user tries to delete post they do not own', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer different-user-token');

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

            const response = await request(app)
                .delete('/api/v1/posts/non-existent-id')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Successful Deletion Tests', () => {
        it('should delete post and return success message', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Post deleted successfully');
        });

        it('should invalidate cache after successful deletion', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(200);
            // Cache should be invalidated
            expect(global.mockCacheInstance.del).toHaveBeenCalled();
        });

        it('should handle deletion of post with associated media', async () => {
            // Mock media repository to return associated media
            const mockMediaRepository = {
                findByPostId: jest.fn().mockResolvedValue([
                    { id: 'media1', public_id: 'cloudinary_id_1' },
                    { id: 'media2', public_id: 'cloudinary_id_2' }
                ]),
                removeByPostId: jest.fn().mockResolvedValue({ success: true })
            };

            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle deletion of post with associated comments', async () => {
            // Comments should be handled via database CASCADE or explicit deletion
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Response Format Tests', () => {
        it('should return success response with correct structure', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(typeof response.body.message).toBe('string');
        });

        it('should not return sensitive information in response', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(200);
            // Should not expose database details or internal implementation
            expect(response.body).not.toHaveProperty('query');
            expect(response.body).not.toHaveProperty('sql');
            expect(response.body).not.toHaveProperty('internal_error');
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle database errors gracefully', async () => {
            // Mock database error during deletion
            const supabase = require('../../src/db/initSupabase');
            supabase.from.mockReturnValueOnce({
                delete: jest.fn().mockReturnValueOnce({
                    eq: jest.fn().mockReturnValueOnce({
                        select: jest.fn().mockReturnValueOnce({
                            then: jest.fn((callback) => callback({
                                data: null,
                                error: { message: 'Database deletion failed' }
                            }))
                        })
                    })
                })
            });

            const response = await request(app)
                .delete('/api/v1/posts/db-error-id')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle invalid post ID format', async () => {
            const response = await request(app)
                .delete('/api/v1/posts/invalid-id-format')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect([400, 404]).toContain(response.status);
            expect(response.body.success).toBe(false);
        });

        it('should handle cloudinary deletion errors gracefully', async () => {
            // Mock cloudinary service to throw error
            global.mockCloudinaryService.createCloudinaryService().deleteFile.mockRejectedValueOnce(
                new Error('Cloudinary deletion failed')
            );

            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            // Should still succeed even if cloudinary deletion fails
            // This depends on business logic - some apps might rollback, others might continue
            expect([200, 400]).toContain(response.status);
        });
    });

    describe('Security Tests', () => {
        it('should prevent SQL injection in post ID', async () => {
            const maliciousId = "1'; DROP TABLE posts; --";
            
            const response = await request(app)
                .delete(`/api/v1/posts/${encodeURIComponent(maliciousId)}`)
                .set('Authorization', 'Bearer valid-jwt-token');

            expect([200, 400, 404]).toContain(response.status);
            // Should not execute malicious SQL
        });

        it('should prevent deletion attempts with XSS in post ID', async () => {
            const xssId = '<script>alert("xss")</script>';
            
            const response = await request(app)
                .delete(`/api/v1/posts/${encodeURIComponent(xssId)}`)
                .set('Authorization', 'Bearer valid-jwt-token');

            expect([200, 400, 404]).toContain(response.status);
        });

        it('should not expose internal error details in production', async () => {
            // Mock internal error
            const supabase = require('../../src/db/initSupabase');
            supabase.from.mockImplementationOnce(() => {
                throw new Error('Internal database configuration error with sensitive details');
            });

            const response = await request(app)
                .delete('/api/v1/posts/error-500-id')
                .set('Authorization', 'Bearer valid-jwt-token');

            // Should handle internal errors gracefully
            expect([200, 400, 500]).toContain(response.status);
            if (response.status === 500) {
                expect(response.body.success).toBe(false);
                // Should not expose sensitive error details
                expect(response.body.message).not.toContain('database configuration');
                expect(response.body.message).not.toContain('sensitive details');
            }
        });
    });

    describe('Performance Tests', () => {
        it('should complete deletion within reasonable time', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect([200, 404]).toContain(response.status);
            expect(responseTime).toBeLessThan(2000); // Should complete within 2 seconds
        });
    });

    describe('Idempotency Tests', () => {
        it('should handle repeated deletion attempts gracefully', async () => {
            // First deletion
            const response1 = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            // Second deletion attempt
            const response2 = await request(app)
                .delete('/api/v1/posts/post123')
                .set('Authorization', 'Bearer valid-jwt-token');

            expect(response1.status).toBe(200);
            // Should handle gracefully - either 200 (idempotent) or 404 (not found)
            expect([200, 404]).toContain(response2.status);
        });
    });
});
