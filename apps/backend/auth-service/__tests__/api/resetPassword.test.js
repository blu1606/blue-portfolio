// __tests__/api/resetPassword.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/auth/reset-password', () => {
    const validEmail = 'test@example.com';
    const validResetToken = 'a'.repeat(32); // 32 character hex string
    const validNewPassword = 'NewSecretKey456!';
    const invalidNewPassword = 'weak';

    it('should return 200 OK and reset password successfully', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: validResetToken,
                newPassword: validNewPassword
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Password reset successful');
    });

    it('should return 400 Bad Request if email is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                resetToken: validResetToken,
                newPassword: validNewPassword
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Email is required');
    });

    it('should return 400 Bad Request if reset token is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail,
                newPassword: validNewPassword
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Reset token is required');
    });

    it('should return 400 Bad Request if new password is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: validResetToken
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password is required');
    });

    it('should return 400 Bad Request for invalid email format', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: 'invalid-email', 
                resetToken: validResetToken,
                newPassword: validNewPassword
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid email format');
    });

    it('should return 400 Bad Request for reset token that is too short', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: 'short',
                newPassword: validNewPassword
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Reset token must be at least 32 characters');
    });

    it('should return 400 Bad Request for password that is too short', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: validResetToken,
                newPassword: 'short'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must be at least 12 characters long');
    });

    it('should return 400 Bad Request for password without uppercase', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: validResetToken,
                newPassword: 'newpassword123!'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must contain at least one uppercase letter');
    });

    it('should return 400 Bad Request for password without lowercase', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: validResetToken,
                newPassword: 'NEWPASSWORD123!'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must contain at least one lowercase letter');
    });

    it('should return 400 Bad Request for password without numbers', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: validResetToken,
                newPassword: 'NewPassword!'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must contain at least one number');
    });

    it('should return 400 Bad Request for password without special characters', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: validResetToken,
                newPassword: 'NewPassword123'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must contain at least one special character');
    });

    it('should return 400 Bad Request for password with blocked patterns', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ 
                email: validEmail, 
                resetToken: validResetToken,
                newPassword: 'NewPassword123!password'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password contains common weak patterns');
    });
});
