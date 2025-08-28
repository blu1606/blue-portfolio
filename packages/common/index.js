// packages/common/index.js
/**
 * Main entry point for @blue-portfolio/common package
 * Exports all shared utilities and components
 */

// Core components
const { SuccessResponse } = require('./core/success.response');
const { BadRequestError, NotFoundError, InternalServerError } = require('./core/error.response');

// Utilities
const { createLogger } = require('./utils/logger');
const { RepositoryHelper } = require('./utils/repositoryHelper');
const { CacheHelper } = require('./utils/cacheHelper');
const { DatabaseErrorHandler } = require('./utils/databaseErrorHandler');
const { CommonUtils } = require('./utils/commonUtils');

// Configuration
const { ConfigManager, configManager } = require('./configs/configManager');

// Services
const { BaseService } = require('./services/baseService');

// Helpers
const asyncHandler = require('./helpers/asyncHandler');

// Middlewares
const authentication = require('./middlewares/authentication');
const authorizationMiddleware = require('./middlewares/authorizationMiddleware');
const rateLimitMiddleware = require('./middlewares/rateLimitMiddleware');
const validationMiddleware = require('./middlewares/validationMiddleware');

// HTTP Status utilities
const httpStatusCode = require('./utils/httpStatusCode');
const reasonPhrases = require('./utils/reasonPhrases');
const statusCodes = require('./utils/statusCodes');

module.exports = {
  // Core
  SuccessResponse,
  BadRequestError,
  NotFoundError,
  InternalServerError,

  // Utilities
  createLogger,
  RepositoryHelper,
  CacheHelper,
  DatabaseErrorHandler,
  CommonUtils,

  // Configuration
  ConfigManager,
  configManager,

  // Services
  BaseService,

  // Helpers
  asyncHandler,

  // Middlewares
  authentication,
  authorizationMiddleware,
  rateLimitMiddleware,
  validationMiddleware,

  // HTTP Status
  httpStatusCode,
  reasonPhrases,
  statusCodes
};
