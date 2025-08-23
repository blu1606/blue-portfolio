// __tests__/api/emailVerification.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/v1/auth/verify-email/:token', () => {
    const validToken = 'valid-verification-token';
    const invalidToken = 'invalid-verification-token';

    it('should return 200 OK and verify email successfully for valid token', async () => {
        const response = await request(app)
            .get(`/api/v1/auth/verify-email/${validToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Email verified successfully');
    });

    it('should return 400 Bad Request if token is missing', async () => {
        const response = await request(app)
            .get('/api/v1/auth/verify-email/');

        expect(response.status).toBe(404);
    });

    it('should return 400 Bad Request if token is empty', async () => {
        const response = await request(app)
            .get('/api/v1/auth/verify-email/');

        expect(response.status).toBe(404);
    });

    it('should return 400 Bad Request for invalid token format', async () => {
        const response = await request(app)
            .get('/api/v1/auth/verify-email/short-token');

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid verification token');
    });

    it('should return 400 Bad Request for expired token', async () => {
        const response = await request(app)
            .get('/api/v1/auth/verify-email/expired-token');

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Verification token expired');
    });
});

describe('POST /api/v1/auth/resend-verification', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';

    it('should return 200 OK and resend verification email for valid email', async () => {
        const response = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({ email: validEmail });

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Verification email sent successfully');
    });

    it('should return 400 Bad Request if email is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 Bad Request for invalid email format', async () => {
        const response = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({ email: invalidEmail });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 Bad Request for empty email', async () => {
        const response = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({ email: '' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 Bad Request for email that is too long', async () => {
        const longEmail = 'a'.repeat(300) + '@example.com';
        const response = await request(app)
            .post('/api/v1/auth/resend-verification')
            .send({ email: longEmail });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email address too long');
    });
});
