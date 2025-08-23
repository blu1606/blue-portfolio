// src/usecases/resetPassword.js
const bcrypt = require('bcryptjs');
const { validateEmail, validatePassword, validateResetToken } = require('../utils/validation');
const { NotFoundError, AuthFailureError, BadRequestError } = require('common/core/error.response');

const createResetPasswordUseCase = (userRepository, auditService, config) => {
  return async (email, resetToken, newPassword, auditDetails = {}) => {
    // Validate inputs in the correct order: email first, then reset token, then password
    const normalizedEmail = validateEmail(email);
    validateResetToken(resetToken);
    
    if (!newPassword) {
      throw new BadRequestError('Password is required');
    }
    
    validatePassword(newPassword);

    // Find user
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      await auditService.log('PASSWORD_RESET_USER_NOT_FOUND', normalizedEmail, false, auditDetails);
      throw new NotFoundError('User not found');
    }

    // Verify reset token
    if (!user.reset_token || user.reset_token !== resetToken) {
      await auditService.log('PASSWORD_RESET_INVALID_TOKEN', normalizedEmail, false, auditDetails);
      throw new AuthFailureError('Invalid or missing reset token');
    }

    // Check token expiration
    const currentTime = new Date();
    const tokenExpiry = new Date(user.reset_token_expiry);
    if (currentTime > tokenExpiry) {
      await userRepository.updateOTPData(user.id, {
        reset_token: null,
        reset_token_expiry: null
      });
      await auditService.log('PASSWORD_RESET_TOKEN_EXPIRED', normalizedEmail, false, auditDetails);
      throw new AuthFailureError('Reset token expired. Please request a new OTP');
    }

    // Check if new password is same as old password
    if (user.password_hash) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        await auditService.log('PASSWORD_RESET_SAME_PASSWORD', normalizedEmail, false, auditDetails);
        throw new BadRequestError('New password must be different from your current password');
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    // Update password
    await userRepository.updatePassword(user.id, {
      passwordHash: hashedPassword,
      additionalFields: {
        session_version: (user.session_version || 0) + 1 // Invalidate existing sessions
      }
    });

    await auditService.log('PASSWORD_RESET_SUCCESS', normalizedEmail, true, auditDetails);

    return { message: 'Password reset successful. Please log in with your new password.' };
  };
};

module.exports = { createResetPasswordUseCase };