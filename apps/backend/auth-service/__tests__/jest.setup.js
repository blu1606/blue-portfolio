// /auth-service/__tests__/setup.js
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test-key';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-api-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-api-secret';

// Mock Supabase client used across the service
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => {
        const createChainableMock = () => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            like: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            contains: jest.fn().mockReturnThis(),
            containedBy: jest.fn().mockReturnThis(),
            rangeGt: jest.fn().mockReturnThis(),
            rangeGte: jest.fn().mockReturnThis(),
            rangeLt: jest.fn().mockReturnThis(),
            rangeLte: jest.fn().mockReturnThis(),
            rangeAdjacent: jest.fn().mockReturnThis(),
            overlaps: jest.fn().mockReturnThis(),
            textSearch: jest.fn().mockReturnThis(),
            filter: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found in test', code: 'PGRST116' } })),
            maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
            then: jest.fn((cb) => cb({ data: null, error: { message: 'Not found in test', code: 'PGRST116' } }))
        });

        return {
            from: jest.fn(() => createChainableMock())
        };
    })
}));

// Mock cloudinary
jest.mock('cloudinary', () => ({ 
    v2: { 
        config: jest.fn(), 
        uploader: { 
            upload: jest.fn().mockResolvedValue({ 
                public_id: 'test-avatar-id', 
                secure_url: 'https://test.cloudinary.com/avatar.jpg' 
            }), 
            destroy: jest.fn().mockResolvedValue({ result: 'ok' }) 
        } 
    } 
}));

// Mock jsonwebtoken module
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
    sign: jest.fn(() => 'mocked-jwt-token'),
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