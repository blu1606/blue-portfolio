// src/services/jwtService.js
const jwt = require('jsonwebtoken');
const { BadRequestError, AuthFailureError } = require('common/core/error.response');

const createJWTService = (config) => {
  const generateToken = (payload, options = {}) => {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestError('Payload is required and must be an object');
    }

    const defaultOptions = {
      expiresIn: '24h',
      issuer: 'auth-service',
      audience: 'blue-portfolio'
    };

    const jwtOptions = { ...defaultOptions, ...options };
    
    try {
      const token = jwt.sign(payload, config.JWT_SECRET, jwtOptions);
      return {
        token,
        expiresIn: jwtOptions.expiresIn,
        issuedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new AuthFailureError('Failed to generate token');
    }
  };

  const verifyToken = (token) => {
    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Token is required and must be a string');
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      return {
        valid: true,
        payload: decoded,
        issuedAt: new Date(decoded.iat * 1000).toISOString(),
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthFailureError('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new AuthFailureError('Invalid token');
      } else {
        throw new AuthFailureError('Token verification failed');
      }
    }
  };

  const refreshToken = (token) => {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, { ignoreExpiration: true });
      
      // Remove iat and exp from payload
      const { iat, exp, ...payload } = decoded;
      
      return generateToken(payload);
    } catch (error) {
      throw new AuthFailureError('Invalid refresh token');
    }
  };

  return {
    generateToken,
    verifyToken,
    refreshToken
  };
};

module.exports = { createJWTService };
