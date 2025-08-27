// __tests__/api/createAnonymousFeedback.test.js
const request = require('supertest');
const app = require('../../src/app');
const path = require('path');

describe('POST /api/v1/feedback/anonymous - Create Anonymous Feedback', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Validation Tests', () => {
        it('should return 400 when content is missing', async () => {
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send({
                    authorName: 'John Doe'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Content is required');
        });

        it('should return 400 when author name is missing', async () => {
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send({
                    content: 'This is a test feedback with sufficient length'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Author name is required');
        });

        it('should return 400 when content is too short', async () => {
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send({
                    authorName: 'John Doe',
                    content: 'Short'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('at least 10 characters');
        });

        it('should return 400 when content is too long', async () => {
            const longContent = 'a'.repeat(2001);
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send({
                    authorName: 'John Doe',
                    content: longContent
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('must not exceed 2000 characters');
        });

        it('should return 400 when email format is invalid', async () => {
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send({
                    authorName: 'John Doe',
                    authorEmail: 'invalid-email',
                    content: 'This is a valid feedback content with sufficient length'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('valid email address');
        });

        it('should return 400 when rating is invalid', async () => {
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send({
                    authorName: 'John Doe',
                    content: 'This is a valid feedback content with sufficient length',
                    rating: 6
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Rating must be between 1 and 5');
        });
    });

    describe('Successful Creation', () => {
        it('should create anonymous feedback successfully without images', async () => {
            const feedbackData = {
                authorName: 'John Doe',
                authorEmail: 'john@example.com',
                content: 'This is a test feedback with sufficient length for validation',
                rating: 5
            };

            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('submitted successfully');
            expect(response.body.metadata).toBeDefined();
            expect(response.body.metadata.authorName).toBe('John Doe');
            expect(response.body.metadata.rating).toBe(5);
            expect(response.body.metadata.isAnonymous).toBe(true);
        });

        it('should create anonymous feedback successfully with valid rating', async () => {
            const feedbackData = {
                authorName: 'Jane Smith',
                content: 'Great service! Very satisfied with the quality and support provided.',
                rating: 4
            };

            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.metadata.authorName).toBe('Jane Smith');
            expect(response.body.metadata.rating).toBe(4);
        });

        it('should create anonymous feedback without email and rating', async () => {
            const feedbackData = {
                authorName: 'Anonymous User',
                content: 'Simple feedback without additional details but with enough content.'
            };

            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.metadata.authorName).toBe('Anonymous User');
            expect(response.body.metadata.rating).toBeNull();
        });
    });

    describe('File Upload Tests', () => {
        it('should accept image uploads for avatar and additional images', async () => {
            // Create test image buffer
            const testImageBuffer = Buffer.from('fake-image-data');
            
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .field('authorName', 'John Doe')
                .field('content', 'Feedback with images attached for better context')
                .field('rating', '5')
                .attach('avatar', testImageBuffer, 'avatar.jpg')
                .attach('images', testImageBuffer, 'screenshot1.jpg')
                .attach('images', testImageBuffer, 'screenshot2.jpg');

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.metadata.authorName).toBe('John Doe');
        });
    });

    describe('Rate Limiting Tests', () => {
        it('should apply rate limiting for anonymous feedback', async () => {
            const feedbackData = {
                authorName: 'Rate Test User',
                content: 'Testing rate limiting functionality with valid content length'
            };

            // Make multiple requests quickly
            const promises = Array(5).fill().map(() => 
                request(app)
                    .post('/api/v1/feedback/anonymous')
                    .send(feedbackData)
            );

            const responses = await Promise.all(promises);
            
            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });

    describe('Security Tests', () => {
        it('should sanitize malicious content', async () => {
            const maliciousContent = 'Normal content <script>alert("xss")</script> with scripts';
            
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send({
                    authorName: 'Security Tester',
                    content: maliciousContent
                });

            expect(response.status).toBe(201);
            expect(response.body.metadata.content).not.toContain('<script>');
        });

        it('should handle special characters in author name', async () => {
            const response = await request(app)
                .post('/api/v1/feedback/anonymous')
                .send({
                    authorName: 'José María ñ 中文',
                    content: 'Testing international characters in names and content'
                });

            expect(response.status).toBe(201);
            expect(response.body.metadata.authorName).toBe('José María ñ 中文');
        });
    });
});
