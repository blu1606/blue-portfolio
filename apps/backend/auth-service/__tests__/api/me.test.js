// __tests__/api/me.test.js
const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');

// Mock các module bên ngoài
jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'),
    verify: jest.fn(),
}));

describe('GET /api/v1/auth/me', () => {
    const mockToken = 'valid-jwt-token';
    const mockPayload = { id: 'user123', username: 'testuser' };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 OK and user info for a valid token', async () => {
        // Giả lập jwt.verify để trả về payload hợp lệ
        jwt.verify.mockReturnValue(mockPayload);

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${mockToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('User profile fetched successfully!');
        expect(response.body.metadata).toEqual(mockPayload);
        expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me');

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });

    it('should return 401 Unauthorized for an invalid token', async () => {
        // Giả lập jwt.verify ném ra lỗi khi token không hợp lệ
        jwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer invalid-token`);

        expect(response.status).toBe(401);
        expect(response.body.message).toEqual('Authentication Invalid');
    });
});