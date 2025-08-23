// __tests__/api/requestOTP.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/auth/request-otp', () => {
    const validEmail = 'test@example.com';

    it('should return 200 OK and send OTP for valid email', async () => {
        const response = await request(app)
            .post('/api/v1/auth/request-otp')
            .send({ email: validEmail });

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('OTP sent to your email');
    });

    it('should return 400 Bad Request if email is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/request-otp')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 Bad Request for invalid email format', async () => {
        const response = await request(app)
            .post('/api/v1/auth/request-otp')
            .send({ email: 'invalid-email' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 Bad Request for empty email', async () => {
        const response = await request(app)
            .post('/api/v1/auth/request-otp')
            .send({ email: '' });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 Bad Request for email that is too long', async () => {
        const longEmail = 'a'.repeat(300) + '@example.com';
        const response = await request(app)
            .post('/api/v1/auth/request-otp')
            .send({ email: longEmail });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email address too long');
    });
});
