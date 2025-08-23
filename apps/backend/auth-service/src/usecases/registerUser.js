// src/usecases/registerUser.js
const bcrypt = require('bcryptjs');
const { validateEmail, validatePassword } = require('../utils/validation');
const { BadRequestError, ConflictRequestError } = require('common/core/error.response');

const createRegisterUseCase = (userRepository, jwtService, auditService, config) => {
  return async (username, email, password, auditDetails = {}) => {
    // Validate inputs
    if (!username || !email || !password) {
      throw new BadRequestError('Username, email, and password are required.');
    }

    if (username.length < 3 || username.length > 50) {
      throw new BadRequestError('Username must be between 3 and 50 characters long.');
    }

    const normalizedEmail = validateEmail(email);
    validatePassword(password);

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      await auditService.log('REGISTER_EMAIL_EXISTS', normalizedEmail, false, auditDetails);
      throw new ConflictRequestError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.OTP_CONFIG.BCRYPT_ROUNDS);

    // Create user data
    const userData = {
      username,
      email: normalizedEmail,
      password_hash: hashedPassword,
      email_verified: false,
      account_locked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create user
    const newUser = await userRepository.create(userData);

    // Generate JWT token for the new user
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username
    };

    const tokenData = jwtService.generateToken(tokenPayload);

    await auditService.log('REGISTER_SUCCESS', normalizedEmail, true, auditDetails);

    return {
      token: tokenData.token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        email_verified: newUser.email_verified
      }
    };
  };
};

module.exports = { createRegisterUseCase };
