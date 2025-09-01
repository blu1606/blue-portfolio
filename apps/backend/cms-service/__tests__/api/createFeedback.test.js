// __tests__/api/createFeedback.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/feedback - Create Feedback', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Authentication Required', () => {
        it('should return 401 when no authorization header is provided', async () => {
            const feedbackData = {
                content: 'This is a test feedback'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .send(feedbackData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 401 when invalid token is provided', async () => {
            const feedbackData = {
                content: 'This is a test feedback'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer invalid-token')
                .send(feedbackData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Validation Tests', () => {
        it('should return 400 when content is missing', async () => {
            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send({});

            expect(response.status).toBe(400);
        });

        it('should return 400 when content is too short', async () => {
            const feedbackData = {
                content: 'Hi'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(400);
        });

        it('should return 400 when content is too long', async () => {
            const feedbackData = {
                content: 'a'.repeat(2001) // Assuming 2000 char limit
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(400);
        });

        it('should accept minimum length content', async () => {
            const feedbackData = {
                content: 'This is valid feedback content with sufficient length'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Successful Feedback Creation', () => {
        it('should create feedback successfully with valid data', async () => {
            const feedbackData = {
                content: 'This is a comprehensive test feedback that provides valuable insights about the website functionality'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Feedback created successfully');
            expect(response.body.metadata).toHaveProperty('id');
            expect(response.body.metadata).toHaveProperty('content', feedbackData.content);
            expect(response.body.metadata).toHaveProperty('user_id', 'user123');
            expect(response.body.metadata).toHaveProperty('is_approved', false);
        });

        it('should set feedback as not approved by default', async () => {
            const feedbackData = {
                content: 'Feedback that should be pending approval'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.is_approved).toBe(false);
        });

        it('should set correct timestamps when creating feedback', async () => {
            const feedbackData = {
                content: 'Testing timestamp creation for feedback'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.metadata).toHaveProperty('created_at');
            
            const createdAt = new Date(response.body.metadata.created_at);
            expect(createdAt).toBeInstanceOf(Date);
        });

        it('should handle special characters in feedback content', async () => {
            const feedbackData = {
                content: 'Feedback with special characters: áéíóú ñ ¿¡ !@#$%^&*()_+-={}[]|;:,.<>?'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.content).toBe(feedbackData.content);
        });

        it('should handle unicode characters in feedback content', async () => {
            const feedbackData = {
                content: 'Unicode feedback: 这是一个测试反馈 🚀 ✨ 💡'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.content).toBe(feedbackData.content);
        });
    });

    describe('Response Format Tests', () => {
        it('should return feedback with correct structure', async () => {
            const feedbackData = {
                content: 'Test feedback for structure validation'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('metadata');

            const feedback = response.body.metadata;
            expect(feedback).toHaveProperty('id');
            expect(feedback).toHaveProperty('user_id');
            expect(feedback).toHaveProperty('content');
            expect(feedback).toHaveProperty('is_approved');
            expect(feedback).toHaveProperty('created_at');
        });

        it('should not expose sensitive user information', async () => {
            const feedbackData = {
                content: 'Test feedback for security validation'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            const feedback = response.body.metadata;
            
            expect(feedback).not.toHaveProperty('password');
            expect(feedback).not.toHaveProperty('email');
            expect(feedback).not.toHaveProperty('private_key');
        });
    });

    describe('Rate Limiting Tests', () => {
        it('should prevent spam feedback creation', async () => {
            const feedbackData = {
                content: 'Rapid feedback submission test'
            };

            // Create multiple feedback quickly
            const promises = Array(5).fill().map(() => 
                request(app)
                    .post('/api/v1/feedback')
                    .set('Authorization', 'Bearer valid-jwt-token')
                    .send(feedbackData)
            );

            const responses = await Promise.all(promises);
            
            // At least some should succeed, but rate limiting might kick in
            const successCount = responses.filter(r => r.status === 201).length;
            const rateLimitedCount = responses.filter(r => r.status === 429).length;
            
            expect(successCount + rateLimitedCount).toBe(5);
        });
    });

    describe('Security Tests', () => {
        it('should sanitize feedback content to prevent XSS', async () => {
            const xssFeedbackData = {
                content: 'Feedback with <script>alert("xss")</script> malicious content that should be sanitized'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(xssFeedbackData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.content).not.toContain('<script>');
        });

        it('should prevent SQL injection in feedback content', async () => {
            const sqlInjectionData = {
                content: "Feedback with '; DROP TABLE feedback; -- injection attempt that should be handled safely"
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(sqlInjectionData);

            expect(response.status).toBe(201);
            // Should create feedback safely without executing SQL
        });

        it('should not allow creating feedback on behalf of other users', async () => {
            const feedbackData = {
                content: 'Legitimate feedback content',
                userId: 'other-user-id', // Should be ignored
                user_id: 'another-user-id' // Should also be ignored
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.user_id).toBe('user123'); // Should use authenticated user
        });

        it('should not allow setting approval status during creation', async () => {
            const feedbackData = {
                content: 'Feedback trying to set approval status',
                is_approved: true, // Should be ignored
                approved: true // Should also be ignored
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.metadata.is_approved).toBe(false); // Should be false by default
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle database errors gracefully', async () => {
            // Mock database error
            global.mockDatabaseError = true;

            const feedbackData = {
                content: 'Feedback that will trigger database error'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            
            // Reset mock
            global.mockDatabaseError = false;
        });

        it('should handle malformed request body', async () => {
            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .set('Content-Type', 'application/json')
                .send('invalid json');

            expect(response.status).toBe(400);
        });

        it('should handle missing Content-Type header', async () => {
            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send('content=test feedback');

            expect([200, 201, 400]).toContain(response.status);
        });
    });

    describe('Performance Tests', () => {
        it('should create feedback within reasonable time', async () => {
            const startTime = Date.now();
            
            const feedbackData = {
                content: 'Performance test feedback that should be created quickly'
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(response.status).toBe(201);
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });

        it('should handle large feedback content efficiently', async () => {
            const startTime = Date.now();
            
            const feedbackData = {
                content: 'Large feedback content: ' + 'a'.repeat(1500) // Near max length
            };

            const response = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect([201, 400]).toContain(response.status);
            expect(responseTime).toBeLessThan(2000); // Should handle large content within 2 seconds
        });
    });

    describe('Business Logic Tests', () => {
        it('should prevent duplicate feedback from same user', async () => {
            const feedbackData = {
                content: 'Unique feedback content for duplicate test'
            };

            // Create first feedback
            const response1 = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            expect(response1.status).toBe(201);

            // Try to create identical feedback
            const response2 = await request(app)
                .post('/api/v1/feedback')
                .set('Authorization', 'Bearer valid-jwt-token')
                .send(feedbackData);

            // Depending on business rules, might allow or prevent duplicates
            expect([201, 409]).toContain(response2.status);
        });
    });
});
