// __tests__/api/validateOTP.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/auth/validate-otp', () => {
    const validEmail = 'test@example.com';
    const validOTP = '123456';
    const invalidOTP = '000000';

    it('should return 200 OK and return reset token for valid OTP', async () => {
        const response = await request(app)
            .post('/api/v1/auth/validate-otp')
            .send({ 
                email: validEmail, 
                otp: validOTP 
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('OTP verified successfully');
        expect(response.body.metadata).toHaveProperty('resetToken');
        expect(typeof response.body.metadata.resetToken).toBe('string');
    });

    it('should return 400 Bad Request if email is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/validate-otp')
            .send({ otp: validOTP });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 Bad Request if OTP is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/validate-otp')
            .send({ email: validEmail });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('OTP is required');
    });

    it('should return 400 Bad Request for invalid OTP format', async () => {
        const response = await request(app)
            .post('/api/v1/auth/validate-otp')
            .send({ 
                email: validEmail, 
                otp: '12345' // 5 digits instead of 6
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('OTP must be a 6-digit number');
    });

    it('should return 400 Bad Request for non-numeric OTP', async () => {
        const response = await request(app)
            .post('/api/v1/auth/validate-otp')
            .send({ 
                email: validEmail, 
                otp: 'abcdef' // non-numeric
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('OTP must be a 6-digit number');
    });

    it('should return 400 Bad Request for invalid email format', async () => {
        const response = await request(app)
            .post('/api/v1/auth/validate-otp')
            .send({ 
                email: 'invalid-email', 
                otp: validOTP 
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 Bad Request for empty email', async () => {
        const response = await request(app)
            .post('/api/v1/auth/validate-otp')
            .send({ 
                email: '', 
                otp: validOTP 
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 Bad Request for empty OTP', async () => {
        const response = await request(app)
            .post('/api/v1/auth/validate-otp')
            .send({ 
                email: validEmail, 
                otp: '' 
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('OTP is required');
    });
});
