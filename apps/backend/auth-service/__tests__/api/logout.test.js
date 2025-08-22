// __tests__/api/logout.test.js
const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

// Mock các module bên ngoài
jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'),
    verify: jest.fn(),
}));

describe('POST /api/v1/auth/logout', () => {
    const mockToken = 'valid-jwt-token';
    const mockPayload = { id: 'user123', username: 'testuser' };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 OK and a success message for a valid token', async () => {
        // Giả lập jwt.verify để trả về payload hợp lệ
        jwt.verify.mockReturnValue(mockPayload);

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
        // Giả lập jwt.verify ném ra lỗi khi token không hợp lệ
        jwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const response = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer invalid-token`);

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });
});