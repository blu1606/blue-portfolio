const { SuccessResponse, CREATED } = require('common/core/success.response.js');
const { AuthFailureError } = require('common/core/error.response.js');
const asyncHandler = require('common/helpers/asyncHandler');

/**
 * Tạo Auth Controller với các phụ thuộc (dependencies)
 * @param {Object} container - Dependency injection container
 * @returns {Object} Một đối tượng chứa các hàm controller
 */
const createAuthController = (container) => {
  // Hàm helper để trích xuất thông tin audit từ request
  const extractAuditDetails = (req) => ({
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    email: req.user?.email || 'anonymous' // Thêm email vào auditDetails
  });

  return {
    register: asyncHandler(async (req, res) => {
      const { username, email, password } = req.body;
      const auditDetails = extractAuditDetails(req);

      const registerUseCase = container.get('registerUseCase');
      const result = await registerUseCase(username, email, password, auditDetails);

      new CREATED({
        message: 'Registration successful!',
        metadata: result,
      }).send(res);
    }),

    login: asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const auditDetails = extractAuditDetails(req);

      const loginUseCase = container.get('loginUseCase');
      const result = await loginUseCase(email, password, auditDetails);

      new SuccessResponse({
        message: 'Login successful!',
        metadata: result,
      }).send(res);
    }),

    requestPasswordReset: asyncHandler(async (req, res) => {
      const { email } = req.body;
      const auditDetails = extractAuditDetails(req);

      const requestOTPUseCase = container.get('requestOTPUseCase');
      const result = await requestOTPUseCase(email, auditDetails);

      new SuccessResponse({
        message: result.message,
      }).send(res);
    }),

    validateOTP: asyncHandler(async (req, res) => {
      const { email, otp } = req.body;
      const auditDetails = extractAuditDetails(req);

      const validateOTPUseCase = container.get('validateOTPUseCase');
      const result = await validateOTPUseCase(email, otp, auditDetails);

      new SuccessResponse({
        message: result.message,
        metadata: {
          resetToken: result.resetToken,
        },
      }).send(res);
    }),

    resetPassword: asyncHandler(async (req, res) => {
      const { email, resetToken, newPassword } = req.body;
      const auditDetails = extractAuditDetails(req);

      const resetPasswordUseCase = container.get('resetPasswordUseCase');
      const result = await resetPasswordUseCase(email, resetToken, newPassword, auditDetails);

      new SuccessResponse({
        message: result.message,
      }).send(res);
    }),

    getMe: asyncHandler(async (req, res) => {
      const user = req.user;
      
      new SuccessResponse({
        message: 'User profile retrieved successfully!',
        metadata: { user },
      }).send(res);
    }),

    logout: asyncHandler(async (req, res) => {
      const user = req.user;
      const auditDetails = extractAuditDetails(req);

      const auditService = container.get('auditService');
      await auditService.log('USER_LOGOUT', user.email, true, auditDetails);

      new SuccessResponse({
        message: 'Logout successful!',
      }).send(res);
    }),

    refreshToken: asyncHandler(async (req, res) => {
      const { refreshToken } = req.body;
      const auditDetails = extractAuditDetails(req);

      // Validate refresh token
      const { validateRefreshToken } = require('../utils/validation');
      validateRefreshToken(refreshToken);

      try {
        const jwtService = container.get('jwtService');
        const result = jwtService.refreshToken(refreshToken);

        const auditService = container.get('auditService');
        await auditService.log('TOKEN_REFRESH', result.payload.email, true, auditDetails);

        new SuccessResponse({
          message: 'Token refreshed successfully!',
          metadata: result,
        }).send(res);
      } catch (error) {
        // Map JWT errors to appropriate HTTP status codes
        if (error.message === 'Invalid refresh token') {
          throw new AuthFailureError('Invalid refresh token');
        }
        if (error.message === 'Token has expired') {
          throw new AuthFailureError('Token has expired');
        }
        throw error; // Re-throw other errors
      }
    }),

    verifyEmail: asyncHandler(async (req, res) => {
      const { token } = req.params;
      const auditDetails = extractAuditDetails(req);
      const jwtService = container.get('jwtService');

      try {
        const { payload } = jwtService.verifyToken(token);
        // In a real app, you would update user.email_verified in the database
        // For mock, we assume it's done
        const auditService = container.get('auditService');
        await auditService.log('EMAIL_VERIFICATION_SUCCESS', payload.email, true, auditDetails);

        new SuccessResponse({
          message: 'Email verified successfully!',
        }).send(res);
      } catch (error) {
        const auditService = container.get('auditService');
        await auditService.log('EMAIL_VERIFICATION_FAILED', 'anonymous', false, auditDetails);
        throw error; // Re-throw to be caught by global error handler
      }
    }),

    resendVerification: asyncHandler(async (req, res) => {
      const { email } = req.body;
      const auditDetails = extractAuditDetails(req);
      const emailService = container.get('emailService');
      const auditService = container.get('auditService');

      // Assume we find the user and generate a new token
      const verificationLink = 'http://localhost:3000/api/v1/auth/verify-email/new-verification-token';
      await emailService.sendEmailVerification(email, verificationLink);

      await auditService.log('RESEND_VERIFICATION_REQUEST', email, true, auditDetails);

      new SuccessResponse({
        message: 'Verification email sent successfully!',
      }).send(res);
    }),

    changePassword: asyncHandler(async (req, res) => {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;
      const auditDetails = extractAuditDetails(req);
      const changePasswordUseCase = container.get('changePasswordUseCase');

      const result = await changePasswordUseCase(user.id, currentPassword, newPassword, auditDetails);

      new SuccessResponse({
        message: result.message,
      }).send(res);
    }),
  };
};

module.exports = { createAuthController };