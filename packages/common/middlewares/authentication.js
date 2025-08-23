// src/middlewares/authentication.js
const jwt = require('jsonwebtoken');
const { AuthFailureError } = require('../core/error.response');

const authenticationMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthFailureError('Authentication Invalid');
        }

        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        // Explicitly check for errors and throw a custom AuthFailureError
        // This ensures the global error handler gets the correct error type
        if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
             throw new AuthFailureError('Authentication Invalid');
        }
        // If it's not a JWT error, still treat it as a failure
        throw new AuthFailureError('Authentication Invalid');
    }
};

module.exports = {
    authenticationMiddleware
};