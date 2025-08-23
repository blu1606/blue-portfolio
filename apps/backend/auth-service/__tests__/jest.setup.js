// /auth-service/__tests__/setup.js
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock JWT_SECRET environment variable
process.env.JWT_SECRET = 'test-secret-key';

// Mock jsonwebtoken module
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
    TokenExpiredError: class TokenExpiredError extends Error {},
    JsonWebTokenError: class JsonWebTokenError extends Error {}
}));

// Mock common package
jest.mock('common/middlewares/authentication', () => ({
    authenticationMiddleware: (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                const error = new Error('Authentication Invalid');
                error.status = 401;
                throw error;
            }

            const token = authHeader.split(' ')[1];
            
            // Kiểm tra token hợp lệ (chỉ chấp nhận 'valid-jwt-token')
            if (token === 'valid-jwt-token') {
                req.user = { id: 'user123', username: 'testuser' };
                next();
            } else {
                // Token không hợp lệ
                const error = new Error('Authentication Invalid');
                error.status = 401;
                throw error;
            }
        } catch (error) {
            const authError = new Error('Authentication Invalid');
            authError.status = 401;
            next(authError);
        }
    }
}));