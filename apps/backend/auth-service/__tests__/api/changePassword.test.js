// __tests__/api/changePassword.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/v1/auth/change-password', () => {
    const mockToken = 'valid-jwt-token';
    const validCurrentPassword = 'CurrentPassword123!';
    const validNewPassword = 'NewSecretKey456!';
    const weakNewPassword = 'weak';

    it('should return 200 OK and change password successfully for authenticated user', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: validNewPassword
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toContain('Password changed successfully');
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: validNewPassword
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });

    it('should return 401 Unauthorized for invalid token', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', 'Bearer invalid-token')
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: validNewPassword
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });

    it('should return 400 Bad Request if current password is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ newPassword: validNewPassword });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Current password is required');
    });

    it('should return 400 Bad Request if new password is missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ currentPassword: validCurrentPassword });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('New password is required');
    });

    it('should return 400 Bad Request if current password is empty', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: '',
                newPassword: validNewPassword
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Current password is required');
    });

    it('should return 400 Bad Request if new password is empty', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: ''
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('New password is required');
    });

    it('should return 400 Bad Request for new password that is too short', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: 'short'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must be at least 12 characters long');
    });

    it('should return 400 Bad Request for new password without uppercase', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: 'newpassword123!'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must contain at least one uppercase letter');
    });

    it('should return 400 Bad Request for new password without lowercase', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: 'NEWPASSWORD123!'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must contain at least one lowercase letter');
    });

    it('should return 400 Bad Request for new password without numbers', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: 'NewPassword!'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must contain at least one number');
    });

    it('should return 400 Bad Request for new password without special characters', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: 'NewPassword123'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password must contain at least one special character');
    });

    it('should return 400 Bad Request for new password with blocked patterns', async () => {
        const response = await request(app)
            .post('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${mockToken}`)
            .send({ 
                currentPassword: validCurrentPassword,
                newPassword: 'NewPassword123!password'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Password contains common weak patterns');
    });
});
