// src/usecases/logoutUser.js
const { SuccessResponse } = require('../../../packages/common/core/success.response');

class LogoutUser {
  constructor({ userRepository, tokenBlacklistService, logger }) {
    this.userRepository = userRepository;
    this.tokenBlacklistService = tokenBlacklistService;
    this.logger = logger;
  }

  async execute(req) {
    try {
      const { userId } = req.user;
      const token = req.token;

      // Blacklist the current token
      if (this.tokenBlacklistService && token) {
        await this.tokenBlacklistService.blacklistToken(token);
        this.logger.info(`Token blacklisted for user ${userId}`);
      }

      // Update user's last logout time
      if (this.userRepository) {
        try {
          await this.userRepository.updateUserProfile(userId, {
            last_logout_at: new Date().toISOString()
          });
        } catch (error) {
          // Don't fail logout if this fails
          this.logger.warn(`Failed to update last logout time for user ${userId}:`, error);
        }
      }

      return new SuccessResponse({
        message: 'Logout successful',
        statusCode: 200,
        metadata: {
          userId,
          loggedOutAt: new Date().toISOString()
        }
      });
    } catch (error) {
      this.logger.error('Logout error:', error);
      throw error;
    }
  }
}

module.exports = { LogoutUser };
