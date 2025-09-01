// src/bootstrap.js - Setup all dependencies
const { createContainer } = require('./container');
const supabase = require('./db/initSupabase');
const { OTP_CONFIG } = require('./configs/security.config');

// Import repositories
const { createUserRepository } = require('./repositories/userRepository');
const { createMediaRepository } = require('./repositories/mediaRepository');

// Import services
const { createOTPService } = require('./services/otpService');
const { createEmailService } = require('./services/emailService');
const { createAuditService } = require('./services/auditService');
const { createJWTService } = require('./services/jwtService');
const { createCloudinaryService } = require('./services/cloudinaryService');

// Import use cases
const { createLoginUseCase } = require('./usecases/loginUser');
const { createRegisterUseCase } = require('./usecases/registerUser');
const { createRequestOTPUseCase } = require('./usecases/requestOTP');
const { createValidateOTPUseCase } = require('./usecases/validationOTP');
const { createResetPasswordUseCase } = require('./usecases/resetPassword');
const { createChangePasswordUseCase } = require('./usecases/changePassword');
const { createUpdateUserProfileUseCase } = require('./usecases/updateUserProfile');
const { createGetUserProfileUseCase } = require('./usecases/getUserProfile');

// Import rate limiter
const rateLimiter = require('./utils/rateLimiter');

const setupContainer = () => {
  const container = createContainer();

  // External dependencies
  container.register('supabase', () => supabase, { singleton: true });

  // Register configuration
  container.register('config', () => {
    // Validate critical environment variables
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required for security');
    }
    
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    return {
      OTP_CONFIG,
      JWT_SECRET: process.env.JWT_SECRET
    };
  }, { singleton: true });

  // Register repositories (singletons for DB connections)
  container.register('userRepository', (container) => 
    createUserRepository(container.get('supabase')), { singleton: true });
  container.register('mediaRepository', (container) => 
    createMediaRepository(container.get('supabase')), { singleton: true });

  // Register services (singletons)
  container.register('emailService', () => createEmailService(), { singleton: true });
  container.register('auditService', (container) => 
    createAuditService(container.get('supabase')), { singleton: true });
  container.register('jwtService', (container) => 
    createJWTService(container.get('config')), { singleton: true });
  container.register('cloudinaryService', () => 
    createCloudinaryService(), { singleton: true });
  container.register('tokenBlacklistService', () => {
    const { TokenBlacklistService } = require('./services/tokenBlacklistService');
    return new TokenBlacklistService();
  }, { singleton: true });

  container.register('otpService', (container) => 
    createOTPService(
      OTP_CONFIG,
      container.get('userRepository'),
      container.get('emailService'),
      container.get('auditService')
    ), { singleton: true });

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

  container.register('updateUserProfileUseCase', (container) =>
    createUpdateUserProfileUseCase(
      container.get('userRepository'),
      container.get('mediaRepository'),
      container.get('cloudinaryService')
    )
  );

  container.register('getUserProfileUseCase', (container) =>
    createGetUserProfileUseCase(
      container.get('userRepository'),
      container.get('mediaRepository')
    )
  );

  container.register('logoutUseCase', (container) => {
    const { LogoutUser } = require('./usecases/logoutUser');
    return new LogoutUser({
      userRepository: container.get('userRepository'),
      tokenBlacklistService: container.get('tokenBlacklistService'),
      logger: console
    });
  });

  return container;
};

module.exports = { setupContainer };