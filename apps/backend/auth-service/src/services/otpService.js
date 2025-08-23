// src/services/otpService.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ValidationError, BadRequestError } = require('common/core/error.response');

const createOTPService = (config, userRepository, emailService, auditService) => {
  const generateSecureOTP = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
  };

  const createOTP = async (userId) => {
    const otp = generateSecureOTP(config.OTP_LENGTH);
    const otpGeneratedAt = new Date().toISOString();
    const otpHash = await bcrypt.hash(otp, config.BCRYPT_ROUNDS);

    await userRepository.updateOTPData(userId, {
      otp_hash: otpHash,
      otp_generated_at: otpGeneratedAt,
      otp_attempts: 0,
      reset_token: null,
      reset_token_expiry: null
    });

    return {
      code: otp,
      expiresAt: new Date(Date.now() + config.EXPIRY_SECONDS * 1000)
    };
  };

  const validateOTP = async (user, otpCode) => {
    if (!user.otp_hash) {
      throw new ValidationError('No OTP found. Please request a new one');
    }

    // Check expiration
    const currentTime = new Date();
    const otpTime = new Date(user.otp_generated_at);
    const timeDifference = (currentTime - otpTime) / 1000;

    if (timeDifference > config.EXPIRY_SECONDS) {
      await userRepository.updateOTPData(user.id, {
        otp_hash: null,
        otp_generated_at: null
      });
      throw new ValidationError('OTP expired. Please request a new one');
    }

    // Validate OTP
    const isValidOTP = await bcrypt.compare(otpCode, user.otp_hash);
    
    if (!isValidOTP) {
      const newAttempts = (user.otp_attempts || 0) + 1;
      await userRepository.updateOTPData(user.id, { otp_attempts: newAttempts });
      
      if (newAttempts >= 5) {
        await userRepository.updateOTPData(user.id, { account_locked: true });
        throw new ValidationError('Too many invalid attempts. Account has been locked');
      }
      
      throw new ValidationError(`Invalid OTP. ${5 - newAttempts} attempts remaining`);
    }

    return true;
  };

  const generateResetToken = async (userId) => {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + config.RESET_TOKEN_EXPIRY).toISOString();

    await userRepository.updateOTPData(userId, {
      otp_hash: null,
      otp_generated_at: null,
      otp_attempts: 0,
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    return resetToken;
  };

  return {
    generateSecureOTP,
    createOTP,
    validateOTP,
    generateResetToken
  };
};

module.exports = { createOTPService };