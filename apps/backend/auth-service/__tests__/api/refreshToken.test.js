// __tests__/api/refreshToken.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/auth/refresh', () => {
    const validRefreshToken = 'valid-refresh-token';
    const invalidRefreshToken = 'invalid-refresh-token';

    it('should return 200 OK and return new token for valid refresh token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: validRefreshToken });

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Token refreshed successfully');
        expect(response.body.metadata).toHaveProperty('token');
        expect(typeof response.body.metadata.token).toBe('string');
    });

    it('should return 400 Bad Request if refresh token is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Refresh token is required');
    });

    it('should return 400 Bad Request if refresh token is empty', async () => {
        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: '' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Refresh token is required');
    });

    it('should return 400 Bad Request if refresh token is not a string', async () => {
        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: 123 });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Refresh token must be a string');
    });

    it('should return 401 Unauthorized for invalid refresh token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: invalidRefreshToken });

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('Invalid refresh token');
    });

    it('should return 401 Unauthorized for expired refresh token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({ refreshToken: 'expired-token' });

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('Token has expired');
    });
});
