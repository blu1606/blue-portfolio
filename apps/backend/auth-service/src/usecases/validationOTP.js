// src/usecases/validateOTP.js
const { validateEmail, validateOTPFormat } = require('../utils/validation');
const { NotFoundError } = require('common/core/error.response');

const createValidateOTPUseCase = (userRepository, otpService, rateLimiter, auditService) => {
  return async (email, otpCode, auditDetails = {}) => {
    // Validate inputs
    const normalizedEmail = validateEmail(email);
    validateOTPFormat(otpCode);

    // Rate limiting
    await rateLimiter.checkAttemptLimit(normalizedEmail);

    // Find user
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      await auditService.log('OTP_VALIDATION_USER_NOT_FOUND', normalizedEmail, false, auditDetails);
      throw new NotFoundError('User not found');
    }

    // Validate OTP
    await otpService.validateOTP(user, otpCode);

    // Generate reset token
    const resetToken = await otpService.generateResetToken(user.id);

    await auditService.log('OTP_VALIDATION_SUCCESS', normalizedEmail, true, auditDetails);
    
    return {
      message: 'OTP verified successfully.',
      resetToken
    };
  };
};

module.exports = { createValidateOTPUseCase };
