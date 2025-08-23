// __tests__/api/me.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/v1/auth/me', () => {
    const mockToken = 'valid-jwt-token';
    const mockPayload = { 
        user: { 
            id: 'user123', 
            username: 'testuser', 
            email: 'test@example.com' 
        } 
    };

    it('should return 200 OK and user info for a valid token', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('User profile retrieved successfully!');
        expect(response.body.metadata).toEqual(mockPayload);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });

    it('should return 401 Unauthorized for an invalid token', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer invalid-token`);

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });
});