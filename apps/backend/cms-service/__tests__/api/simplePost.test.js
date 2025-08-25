// __tests__/api/simplePost.test.js - Simple test to verify setup
const request = require('supertest');
const app = require('../../src/app');

describe('Simple POST test', () => {
    it('should create a post successfully with minimal setup', async () => {
        const postData = {
            title: 'Test Post',
            content: 'This is test content'
        };

        const response = await request(app)
            .post('/api/v1/posts')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send(postData);

        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Post created successfully');
        expect(response.body.metadata).toHaveProperty('id');
        expect(response.body.metadata).toHaveProperty('title', 'Test Post');
        expect(response.body.metadata).toHaveProperty('slug', 'test-post');
        expect(response.body.metadata).toHaveProperty('is_published', false);
    });

    it('should return 400 when title is missing', async () => {
        const postData = {
            content: 'This is test content'
            // Missing title
        };

        const response = await request(app)
            .post('/api/v1/posts')
            .set('Authorization', 'Bearer valid-jwt-token')
            .send(postData);

        console.log('Validation error status:', response.status);
        console.log('Validation error body:', JSON.stringify(response.body, null, 2));

        expect(response.status).toBe(400);
    });
});
