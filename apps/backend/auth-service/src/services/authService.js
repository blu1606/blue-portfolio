const { setupContainer } = require('../bootstrap');

// Initialize container
const container = setupContainer();

// Export clean, focused functions
module.exports = {
  // Authentication
  registerUser: container.get('authService').register,
  loginUser: container.get('authService').login,
  
  // OTP Management
  generateAndSendOTP: container.get('requestOTPUseCase'),
  validateOTP: container.get('validateOTPUseCase'),
  resetPassword: container.get('resetPasswordUseCase')
};