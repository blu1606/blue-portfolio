// src/middlewares/authenticatedMiddleware.js
const jwt = require('jsonwebtoken');
const { AuthFailureError } = require('common/core/error.response');

const createAuthenticationMiddleware = (tokenBlacklistService) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new AuthFailureError('Authentication Invalid');
            }

            const token = authHeader.split(' ')[1];
            
            // Check if token is blacklisted
            if (tokenBlacklistService && await tokenBlacklistService.isTokenBlacklisted(token)) {
                throw new AuthFailureError('Token has been revoked');
            }

            const payload = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if user session is still valid (for mass revocation)
            if (tokenBlacklistService && payload.userId && payload.iat) {
                const isSessionValid = await tokenBlacklistService.isUserSessionValid(payload.userId, payload.iat);
                if (!isSessionValid) {
                    throw new AuthFailureError('Session has been invalidated');
                }
            }

            req.user = payload;
            req.token = token; // Store token for logout functionality
            next();
        } catch (error) {
            // Explicitly check for errors and throw a custom AuthFailureError
            // This ensures the global error handler gets the correct error type
            if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
                throw new AuthFailureError('Authentication Invalid');
            }
            
            // If it's already an AuthFailureError, re-throw it
            if (error instanceof AuthFailureError) {
                throw error;
            }
            
            // If it's not a JWT error, still treat it as a failure
            throw new AuthFailureError('Authentication Invalid');
        }
    };
};

module.exports = {
    createAuthenticationMiddleware
};
