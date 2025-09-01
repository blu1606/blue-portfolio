// src/routes/authRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { setupContainer } = require('../bootstrap');
const { createAuthController } = require('../controllers/authController');
const { authenticationMiddleware } = require('common/middlewares/authentication');
const { createAuthenticationMiddleware } = require('../middlewares/authenticatedMiddleware');
const { validateRequest } = require('common/middlewares/validationMiddleware');
const { rateLimitMiddleware } = require('common/middlewares/rateLimitMiddleware');
const { avatarUpload } = require('../utils/multer');

const router = express.Router();

// Initialize the dependency injection container and controllers
const container = setupContainer();
const authController = createAuthController(container);

// Create enhanced authentication middleware with token blacklist support
const enhancedAuthMiddleware = createAuthenticationMiddleware(container.get('tokenBlacklistService'));

// Create simple rate limits for now
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Very strict limit for sensitive operations
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Moderate limit for auth operations
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' }
});

// Define validation schemas (Note: they are part of the route file and not moved to a separate middleware file)
const registerSchema = {
    body: {
        username: { type: 'string', minLength: 3, maxLength: 50 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 12 }
    }
};

const loginSchema = {
    body: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 1 }
    }
};

const otpRequestSchema = {
    body: {
        email: { type: 'string', format: 'email' }
    }
};

const otpValidateSchema = {
    body: {
        email: { type: 'string', format: 'email' },
        otp: { type: 'string', pattern: '^[0-9]{6}$' }
    }
};

const resetPasswordSchema = {
    body: {
        email: { type: 'string', format: 'email' },
        resetToken: { type: 'string', minLength: 32 },
        newPassword: { type: 'string', minLength: 12 }
    }
};

// ===================== PUBLIC ROUTES =====================

// User Registration
router.post('/register',
    authRateLimit,
    rateLimitMiddleware('register'),
    validateRequest(registerSchema),
    authController.register
);

// User Login
router.post('/login',
    authRateLimit,
    rateLimitMiddleware('login'),
    validateRequest(loginSchema),
    authController.login
);

// Request Password Reset OTP
router.post('/request-otp',
    strictRateLimit,
    rateLimitMiddleware('otp-request'),
    validateRequest(otpRequestSchema),
    authController.requestPasswordReset // Corrected method name
);

// Validate OTP
router.post('/validate-otp',
    strictRateLimit,
    rateLimitMiddleware('otp-validate'),
    validateRequest(otpValidateSchema),
    authController.validateOTP
);

// Reset Password
router.post('/reset-password',
    strictRateLimit,
    rateLimitMiddleware('password-reset'),
    validateRequest(resetPasswordSchema),
    authController.resetPassword
);

// Refresh Token
router.post('/refresh',
    rateLimitMiddleware('refresh'),
    authController.refreshToken
);

// Email Verification
router.get('/verify-email/:token',
    authController.verifyEmail
);

// Resend Email Verification
router.post('/resend-verification',
    rateLimitMiddleware('resend-verification'),
    validateRequest(otpRequestSchema),
    authController.resendVerification
);

// Apply enhanced authentication middleware to all routes below
router.use(enhancedAuthMiddleware);

// ===================== PROTECTED ROUTES =====================

// Get Current User Profile
router.get('/me',
    authController.getMe
);

// Change Password (authenticated users)
router.post('/change-password',
    rateLimitMiddleware('change-password'),
    validateRequest({
        body: {
            currentPassword: { type: 'string', minLength: 1 },
            newPassword: { type: 'string', minLength: 12 }
        }
    }),
    authController.changePassword
);

// Update Profile (authenticated users)
router.put('/profile',
    rateLimitMiddleware('profile-update'),
    avatarUpload, // Handle avatar file upload
    validateRequest({
        body: {
            username: { type: 'string', minLength: 3, maxLength: 50 },
            bio: { type: 'string', maxLength: 500 },
            location: { type: 'string', maxLength: 100 },
            website: { type: 'string', maxLength: 200 }
        }
    }),
    authController.updateProfile
);

// Logout
router.post('/logout',
    authController.logout
);

module.exports = router;