// src/utils/security.js
const crypto = require('crypto');
const supabase = require('../db/initSupabase'); // Khởi tạo Supabase client
const { OTP_CONFIG } = require('../configs/security.config');

const generateSecureOTP = () => {
  const min = Math.pow(10, OTP_CONFIG.LENGTH - 1);
  const max = Math.pow(10, OTP_CONFIG.LENGTH) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

const auditLog = async (action, email, success, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    email: email.toLowerCase(),
    success,
    ip_address: details.ipAddress,
    user_agent: details.userAgent,
    additional_info: details.additionalInfo
  };
  try {
    await supabase.from('audit_logs').insert([logEntry]);
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

const cleanupExpiredData = async () => {
  try {
    const now = new Date().toISOString();
    await supabase
      .from('users')
      .update({ reset_token: null, reset_token_expiry: null })
      .lt('reset_token_expiry', now)
      .not('reset_token', 'is', null);
    const expiredOTPTime = new Date(Date.now() - (OTP_CONFIG.EXPIRY_SECONDS * 1000)).toISOString();
    await supabase
      .from('users')
      .update({ otp_hash: null, otp_generated_at: null, otp_attempts: 0 })
      .lt('otp_generated_at', expiredOTPTime)
      .not('otp_hash', 'is', null);
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

module.exports = {
  generateSecureOTP,
  auditLog,
  cleanupExpiredData
};