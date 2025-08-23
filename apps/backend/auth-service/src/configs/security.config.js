// src/configs/security.config.js
module.exports = {
    OTP_CONFIG: {
      LENGTH: 6,
      EXPIRY_SECONDS: 300, // 5 minutes
      RATE_LIMIT_ATTEMPTS: 3,
      RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
      MAX_DAILY_REQUESTS: 10,
      BCRYPT_ROUNDS: 12,
      RESET_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
    },
    PASSWORD_REQUIREMENTS: {
      MIN_LENGTH: 12,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SPECIAL: true,
      BLOCKED_PATTERNS: ['123456', 'password', 'qwerty', 'admin']
    }
  };