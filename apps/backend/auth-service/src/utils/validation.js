// src/utils/validation.js
const { BadRequestError } = require('common/core/error.response');
const { OTP_CONFIG, PASSWORD_REQUIREMENTS } = require('../configs/security.config');

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    throw new BadRequestError('Email is required and must be a string.');
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    throw new BadRequestError('Invalid email format');
  }
  
  if (email.length > 320) {
    throw new BadRequestError('Email address too long');
  }

  return email.toLowerCase();
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    throw new BadRequestError('Password is required and must be a string.');
  }
  const errors = [];
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long.`);
  }
  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  const lowerPassword = password.toLowerCase();
  for (const pattern of PASSWORD_REQUIREMENTS.BLOCKED_PATTERNS) {
    if (lowerPassword.includes(pattern)) {
      errors.push('Password contains common weak patterns.');
      break;
    }
  }
  if (errors.length > 0) {
    throw new BadRequestError(`Password validation failed: ${errors.join(' ')}`);
  }
};

const validateOTPFormat = (otp) => {
  if (!otp || typeof otp !== 'string') {
    throw new BadRequestError('OTP is required and must be a string.');
  }
  const otpRegex = new RegExp(`^\\d{${OTP_CONFIG.LENGTH}}$`);
  if (!otpRegex.test(otp)) {
    throw new BadRequestError(`OTP must be a ${OTP_CONFIG.LENGTH}-digit number.`);
  }
};

const validateRefreshToken = (refreshToken) => {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required.');
  }
  if (typeof refreshToken !== 'string') {
    throw new BadRequestError('Refresh token must be a string.');
  }
  if (!refreshToken.trim()) {
    throw new BadRequestError('Refresh token is required.');
  }
};

const validateResetToken = (resetToken) => {
  if (!resetToken) {
    throw new BadRequestError('Reset token is required');
  }
  if (typeof resetToken !== 'string') {
    throw new BadRequestError('Reset token must be a string');
  }
  if (resetToken.length < 32) {
    throw new BadRequestError('Reset token must be at least 32 characters');
  }
};

module.exports = {
  validateEmail,
  validatePassword,
  validateOTPFormat,
  validateRefreshToken,
  validateResetToken
};