// /auth-service/__tests__/setup.js
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock JWT_SECRET environment variable
process.env.JWT_SECRET = 'test-secret-key';



// Mock Supabase
jest.mock('../src/db/initSupabase', () => ({
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            eq: jest.fn((column, value) => {
                if (column === 'email' && value === 'test@example.com') {
                    return { single: jest.fn(() => Promise.resolve({ 
                        data: {
                            id: 'user123',
                            username: 'testuser',
                            email: 'test@example.com',
                            password_hash: 'hashed-password',
                            email_verified: true,
                            account_locked: false,
                            otp_hash: 'mock-otp-hash',
                            otp_generated_at: new Date().toISOString(),
                            otp_attempts: 0,
                            reset_token: 'a'.repeat(32),
                            reset_token_expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                            session_version: 1
                        },
                        error: null 
                    })) };
                } else if (column === 'id' && value === 'user123') {
                    return { single: jest.fn(() => Promise.resolve({ 
                        data: {
                            id: 'user123',
                            username: 'testuser',
                            email: 'test@example.com',
                            password_hash: 'hashed-password',
                            email_verified: true,
                            account_locked: false,
                            otp_hash: 'mock-otp-hash',
                            otp_generated_at: new Date().toISOString(),
                            otp_attempts: 0,
                            reset_token: 'a'.repeat(32),
                            reset_token_expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                            session_version: 1
                        },
                        error: null 
                    })) };
                } else if (column === 'email' && value === 'nonexistent@example.com') {
                    return { single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })) };
                } else if (column === 'email' && value === 'locked@example.com') {
                    return { single: jest.fn(() => Promise.resolve({ 
                        data: {
                            id: 'user456',
                            username: 'lockeduser',
                            email: 'locked@example.com',
                            password_hash: 'hashed-password',
                            email_verified: true,
                            account_locked: true,
                            session_version: 1
                        },
                        error: null 
                    })) };
                } else if (column === 'email' && value === 'unverified@example.com') {
                    return { single: jest.fn(() => Promise.resolve({ 
                        data: {
                            id: 'user789',
                            username: 'unverifieduser',
                            email: 'unverified@example.com',
                            password_hash: 'hashed-password',
                            email_verified: false,
                            account_locked: false,
                            session_version: 1
                        },
                        error: null 
                    })) };
                }
                return { single: jest.fn(() => Promise.resolve({ data: null, error: null })) };
            })
        })),
        insert: jest.fn((data) => ({
            select: jest.fn(() => ({
                single: jest.fn(() => {
                    if (data[0].email === 'existing@example.com') {
                        return Promise.resolve({ data: null, error: { code: '23505', message: 'Duplicate key' } });
                    } else if (data[0].email === 'newuser@example.com') {
                        return Promise.resolve({
                            data: {
                                id: 'new-user-id',
                                username: data[0].username,
                                email: data[0].email,
                                email_verified: false,
                                account_locked: false
                            },
                            error: null
                        });
                    }
                    return Promise.resolve({ data: data[0], error: null });
                })
            }))
        })),
        update: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
    }))
}));

// Mock common package
jest.mock('common/middlewares/authentication', () => ({
    authenticationMiddleware: (req, res, next) => {
        // Skip authentication for public routes
        const publicRoutes = [
            '/api/v1/auth/register',
            '/api/v1/auth/login',
            '/api/v1/auth/request-otp',
            '/api/v1/auth/validate-otp',
            '/api/v1/auth/reset-password',
            '/api/v1/auth/refresh',
            '/api/v1/auth/resend-verification'
        ];
        
        const isVerifyEmailRoute = req.path && req.path.includes('/verify-email/');
        
        if (publicRoutes.includes(req.path) || isVerifyEmailRoute) {
            return next();
        }
        
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
                req.user = { id: 'user123', username: 'testuser', email: 'test@example.com' };
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

// Mock validation middleware
jest.mock('common/middlewares/validationMiddleware', () => ({
    validateRequest: (schema) => (req, res, next) => {
        // Basic validation for testing
        if (schema.body) {
            const { body } = req;
            
            // Email validation
            if (schema.body.email) {
                if (!body.email || body.email.trim() === '') {
                    return res.status(400).json({ message: 'Email is required' });
                }
                
                // Basic email format validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(body.email)) {
                    return res.status(400).json({ message: 'Invalid email format' });
                }
                
                // Email length validation
                if (body.email.length > 254) {
                    return res.status(400).json({ message: 'Email address too long' });
                }
            }
            
            // Token validation for verify-email
            if (req.params && req.params.token) {
                const token = req.params.token;
                if (token.length < 10) {
                    return res.status(400).json({ message: 'Invalid verification token' });
                }
            }
        }
        
        next();
    }
}));

// Mock rate limit middleware
jest.mock('common/middlewares/rateLimitMiddleware', () => ({
    rateLimitMiddleware: (type) => (req, res, next) => next()
}));

// Mock rateLimiter utility
jest.mock('../src/utils/rateLimiter', () => ({
    checkDailyLimit: jest.fn(() => Promise.resolve(true)),
    checkAttemptLimit: jest.fn(() => Promise.resolve(true)),
    clearAttempts: jest.fn()
}));

// Mock email service
jest.mock('../src/services/emailService', () => ({
    createEmailService: jest.fn(() => ({
        sendOTP: jest.fn(() => Promise.resolve({ success: true, messageId: 'mock-otp-id' })),
        sendPasswordReset: jest.fn(() => Promise.resolve({ success: true, messageId: 'mock-reset-id' })),
        sendEmailVerification: jest.fn(() => Promise.resolve({ success: true, messageId: 'mock-verify-id' }))
    }))
}));

// Mock audit service to be more flexible
jest.mock('../src/services/auditService', () => ({
    createAuditService: jest.fn(() => ({
        log: jest.fn((action, email, success, details) => {
            // Accept any valid string for action and email/user identifier
            if (!action || (!email && email !== 'anonymous')) {
                const error = new Error('Action and email are required');
                return Promise.reject(error);
            }
            console.log(`[AUDIT LOG] ${action} - ${email} - ${success ? 'SUCCESS' : 'FAILURE'}`);
            return Promise.resolve({ success: true });
        })
    }))
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn(() => Promise.resolve('hashed-password')),
    compare: jest.fn((password, hashedPassword) => {
        if (password === 'password123' && hashedPassword === 'hashed-password') {
            return Promise.resolve(true);
        }
        // Handle change password test case
        if (password === 'CurrentPassword123!' && hashedPassword === 'hashed-password') {
            return Promise.resolve(true);
        }
        // Handle OTP validation for tests
        if (password === '123456' && hashedPassword === 'mock-otp-hash') {
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }),
    genSalt: jest.fn(() => Promise.resolve('salt'))
}));

// Mock crypto với full implementation để không làm hỏng etag
jest.mock('crypto', () => ({
    ...jest.requireActual('crypto'),
    randomInt: jest.fn(() => 123456),
    randomBytes: jest.fn(() => ({
        toString: jest.fn(() => 'random-token')
    }))
}));

// Mock JWT service to return consistent tokens
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn((token) => {
        if (token === 'valid-verification-token') {
            return { id: 'user123', email: 'test@example.com', username: 'testuser' };
        } else if (token === 'short-token') {
            const error = new Error('Invalid verification token');
            error.name = 'JsonWebTokenError';
            throw error;
        } else if (token === 'expired-token') {
            const error = new Error('Verification token expired');
            error.name = 'TokenExpiredError';
            throw error;
        } else {
            const error = new Error('Token verification failed');
            error.name = 'JsonWebTokenError';
            throw error;
        }
    }),
    TokenExpiredError: class TokenExpiredError extends Error {},
    JsonWebTokenError: class JsonWebTokenError extends Error {}
}));

// Mock JWT service for the container
jest.mock('../src/services/jwtService', () => ({
    createJWTService: jest.fn(() => ({
        verifyToken: jest.fn((token) => {
            if (token === 'valid-verification-token') {
                return { 
                    payload: { id: 'user123', email: 'test@example.com', username: 'testuser' },
                    issuedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 3600000).toISOString()
                };
            } else if (token === 'short-token') {
                const { BadRequestError } = require('common/core/error.response');
                throw new BadRequestError('Invalid verification token');
            } else if (token === 'expired-token') {
                const { BadRequestError } = require('common/core/error.response');
                throw new BadRequestError('Verification token expired');
            } else {
                const { AuthFailureError } = require('common/core/error.response');
                throw new AuthFailureError('Token verification failed');
            }
        }),
        generateToken: jest.fn((payload) => ({
            token: 'mock-jwt-token',
            expiresIn: '24h',
            issuedAt: new Date().toISOString()
        })),
        refreshToken: jest.fn((token) => {
            if (token === 'invalid-refresh-token') {
                throw new Error('Invalid refresh token');
            }
            if (token === 'expired-token') {
                throw new Error('Token has expired');
            }
            if (token === 'valid-refresh-token') {
                return { 
                    token: 'mock-refreshed-token',
                    payload: { id: 'user123', email: 'test@example.com' }
                };
            }
            return { 
                token: 'mock-refreshed-token',
                payload: { id: 'user123', email: 'test@example.com' }
            };
        })
    }))
}));