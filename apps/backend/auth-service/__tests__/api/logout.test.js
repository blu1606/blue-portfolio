// __tests__/api/logout.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/auth/logout', () => {
    const mockToken = 'valid-jwt-token';

    it('should return 200 OK and a success message for a valid token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('Logout successful!');
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
        const response = await request(app)
            .post('/api/v1/auth/logout');

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });

    it('should return 401 Unauthorized for an invalid token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer invalid-token`);

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });
});