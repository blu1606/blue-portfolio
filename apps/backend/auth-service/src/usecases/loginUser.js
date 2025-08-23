// src/usecases/loginUser.js
const bcrypt = require('bcryptjs');
const { validateEmail } = require('../utils/validation');
const { AuthFailureError, BadRequestError } = require('common/core/error.response');

const createLoginUseCase = (userRepository, jwtService, auditService) => {
  return async (email, password, auditDetails = {}) => {
    // Validate inputs
    if (!email || !password) {
      throw new BadRequestError('Email and password are required.');
    }

    const normalizedEmail = validateEmail(email);

    // Find user
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      await auditService.log('LOGIN_USER_NOT_FOUND', normalizedEmail, false, auditDetails);
      throw new AuthFailureError('Invalid credentials');
    }

    // Check account status
    if (user.account_locked) {
      await auditService.log('LOGIN_ACCOUNT_LOCKED', normalizedEmail, false, auditDetails);
      throw new AuthFailureError('Account is locked. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await auditService.log('LOGIN_INVALID_PASSWORD', normalizedEmail, false, auditDetails);
      throw new AuthFailureError('Invalid credentials');
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    const tokenData = jwtService.generateToken(tokenPayload);

    await auditService.log('LOGIN_SUCCESS', normalizedEmail, true, auditDetails);

    return {
      token: tokenData.token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        email_verified: user.email_verified
      }
    };
  };
};

module.exports = { createLoginUseCase };
