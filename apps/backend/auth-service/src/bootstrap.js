// src/bootstrap.js - Setup all dependencies
const { createContainer } = require('./container');
const supabase = require('./db/initSupabase');
const { OTP_CONFIG } = require('./configs/security.config');

// Import repositories
const { createUserRepository } = require('./repositories/userRepository');

// Import services
const { createOTPService } = require('./services/otpService');
const { createEmailService } = require('./services/emailService');
const { createAuditService } = require('./services/auditService');
const { createJWTService } = require('./services/jwtService');

// Import use cases
const { createLoginUseCase } = require('./usecases/loginUser');
const { createRegisterUseCase } = require('./usecases/registerUser');
const { createRequestOTPUseCase } = require('./usecases/requestOTP');
const { createValidateOTPUseCase } = require('./usecases/validationOTP');
const { createResetPasswordUseCase } = require('./usecases/resetPassword');
const { createChangePasswordUseCase } = require('./usecases/changePassword');

// Import rate limiter
const rateLimiter = require('./utils/rateLimiter');

const setupContainer = () => {
  const container = createContainer();

  // Register configuration
  container.register('config', () => ({
    OTP_CONFIG,
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key'
  }));

  // Register repositories
  container.register('userRepository', () => createUserRepository(supabase));

  // Register services
  container.register('emailService', () => createEmailService());
  container.register('auditService', () => createAuditService(supabase));
  container.register('jwtService', () => createJWTService(container.get('config')));

  container.register('otpService', () => 
    createOTPService(
      OTP_CONFIG,
      container.get('userRepository'),
      container.get('emailService'),
      container.get('auditService')
    )
  );

  // Register use cases
  container.register('loginUseCase', () =>
    createLoginUseCase(
      container.get('userRepository'),
      container.get('jwtService'),
      container.get('auditService')
    )
  );

  container.register('registerUseCase', () =>
    createRegisterUseCase(
      container.get('userRepository'),
      container.get('jwtService'),
      container.get('auditService'),
      container.get('config')
    )
  );

  container.register('requestOTPUseCase', () =>
    createRequestOTPUseCase(
      container.get('userRepository'),
      container.get('otpService'),
      container.get('emailService'),
      rateLimiter,
      container.get('auditService')
    )
  );

  container.register('validateOTPUseCase', () =>
    createValidateOTPUseCase(
      container.get('userRepository'),
      container.get('otpService'),
      rateLimiter,
      container.get('auditService')
    )
  );

  container.register('resetPasswordUseCase', () =>
    createResetPasswordUseCase(
      container.get('userRepository'),
      container.get('auditService'),
      OTP_CONFIG
    )
  );

  container.register('changePasswordUseCase', () =>
    createChangePasswordUseCase(
      container.get('userRepository'),
      container.get('auditService'),
      OTP_CONFIG
    )
  );

  return container;
};

module.exports = { setupContainer };