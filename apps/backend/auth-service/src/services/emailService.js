// src/services/emailService.js
const { BadRequestError } = require('common/core/error.response');

const createEmailService = () => {
  const sendOTP = async (email, otpCode) => {
    if (!email || !otpCode) {
      throw new BadRequestError('Email and OTP code are required');
    }

    // TODO: Replace with actual email sending implementation
    // For now, just log the email details
    console.log(`[EMAIL SERVICE] Sending OTP ${otpCode} to ${email}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      messageId: `email_${Date.now()}`,
      sentAt: new Date().toISOString()
    };
  };

  const sendPasswordReset = async (email, resetLink) => {
    if (!email || !resetLink) {
      throw new BadRequestError('Email and reset link are required');
    }

    console.log(`[EMAIL SERVICE] Sending password reset link to ${email}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      messageId: `reset_${Date.now()}`,
      sentAt: new Date().toISOString()
    };
  };

  const sendEmailVerification = async (email, verificationLink) => {
    if (!email || !verificationLink) {
      throw new BadRequestError('Email and verification link are required');
    }

    console.log(`[EMAIL SERVICE] Sending email verification to ${email}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      messageId: `verify_${Date.now()}`,
      sentAt: new Date().toISOString()
    };
  };

  return {
    sendOTP,
    sendPasswordReset,
    sendEmailVerification
  };
};

module.exports = { createEmailService };
