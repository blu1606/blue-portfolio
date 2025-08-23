// src/usecases/changePassword.js
const bcrypt = require('bcryptjs');
const { validatePassword } = require('../utils/validation');
const { BadRequestError, AuthFailureError } = require('common/core/error.response');

const createChangePasswordUseCase = (userRepository, auditService, config) => {
  return async (userId, currentPassword, newPassword, auditDetails = {}) => {
    // Validate inputs
    if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.trim() === '') {
      throw new BadRequestError('Current password is required');
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
      throw new BadRequestError('New password is required');
    }

    // Validate new password strength
    validatePassword(newPassword);

    // Find user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      await auditService.log('PASSWORD_CHANGE_INVALID_CURRENT', user.email, false, auditDetails);
      throw new AuthFailureError('Current password is incorrect');
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      await auditService.log('PASSWORD_CHANGE_SAME_PASSWORD', user.email, false, auditDetails);
      throw new BadRequestError('New password must be different from your current password');
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

    await auditService.log('PASSWORD_CHANGE_SUCCESS', user.email, true, auditDetails);

    return { message: 'Password changed successfully!' };
  };
};

module.exports = { createChangePasswordUseCase };
