// src/usecases/requestOTP.js
const { validateEmail } = require('../utils/validation');
const { ValidationError } = require('common/core/error.response');

const createRequestOTPUseCase = (userRepository, otpService, emailService, rateLimiter, auditService) => {
  return async (email, auditDetails = {}) => {
    // Validate input
    const normalizedEmail = validateEmail(email);

    // Rate limiting
    await rateLimiter.checkDailyLimit(normalizedEmail);

    // Find user
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      await auditService.log('OTP_REQUEST_NONEXISTENT_EMAIL', normalizedEmail, false, auditDetails);
      // Security: Don't reveal if email exists
      return { message: 'If this email exists in our system, an OTP has been sent.' };
    }

    // Check account status
    if (user.account_locked) {
      throw new ValidationError('Account is locked. Please contact support.');
    }

    if (!user.email_verified) {
      throw new ValidationError('Email not verified. Please verify your email first.');
    }

    // Generate OTP
    const otp = await otpService.createOTP(user.id);

    // Send email
    await emailService.sendOTP(normalizedEmail, otp.code);

    await auditService.log('OTP_SENT_SUCCESS', normalizedEmail, true, auditDetails);
    
    return { message: 'OTP sent to your email.' };
  };
};

module.exports = { createRequestOTPUseCase };