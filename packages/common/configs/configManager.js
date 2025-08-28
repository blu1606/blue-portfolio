// packages/common/configs/configManager.js
/**
 * Centralized configuration management
 * Shared across all microservices
 */

const { createLogger } = require('../utils/logger');

const logger = createLogger('ConfigManager');

class ConfigManager {
  constructor() {
    this.config = {
      // Database configuration
      database: {
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 10000,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10
      },

      // Cache configuration
      cache: {
        defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 3600,
        maxKeyLength: parseInt(process.env.CACHE_MAX_KEY_LENGTH) || 250,
        prefixSeparator: process.env.CACHE_PREFIX_SEPARATOR || ':',
        patterns: {
          list: parseInt(process.env.CACHE_LIST_TTL) || 1800,
          item: parseInt(process.env.CACHE_ITEM_TTL) || 3600,
          count: parseInt(process.env.CACHE_COUNT_TTL) || 900,
          search: parseInt(process.env.CACHE_SEARCH_TTL) || 1800
        }
      },

      // Performance configuration
      performance: {
        slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000,
        highMemoryThreshold: parseInt(process.env.HIGH_MEMORY_THRESHOLD) || 512 * 1024 * 1024, // 512MB
        requestRateLimit: parseInt(process.env.REQUEST_RATE_LIMIT) || 100,
        requestRateWindow: parseInt(process.env.REQUEST_RATE_WINDOW) || 60000 // 1 minute
      },

      // File upload configuration
      upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(','),
        uploadPath: process.env.UPLOAD_PATH || './uploads',
        tempPath: process.env.TEMP_PATH || './temp'
      },

      // Pagination configuration
      pagination: {
        defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT) || 10,
        maxLimit: parseInt(process.env.MAX_PAGE_LIMIT) || 100,
        defaultOffset: parseInt(process.env.DEFAULT_OFFSET) || 0
      },

      // Validation configuration
      validation: {
        minPasswordLength: parseInt(process.env.MIN_PASSWORD_LENGTH) || 8,
        maxTitleLength: parseInt(process.env.MAX_TITLE_LENGTH) || 200,
        maxContentLength: parseInt(process.env.MAX_CONTENT_LENGTH) || 50000,
        maxTagLength: parseInt(process.env.MAX_TAG_LENGTH) || 50,
        maxTagsPerPost: parseInt(process.env.MAX_TAGS_PER_POST) || 10
      },

      // Search configuration
      search: {
        minSearchLength: parseInt(process.env.MIN_SEARCH_LENGTH) || 2,
        maxSearchLength: parseInt(process.env.MAX_SEARCH_LENGTH) || 100,
        searchResultLimit: parseInt(process.env.SEARCH_RESULT_LIMIT) || 50
      },

      // Rate limiting configuration
      rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
        skipFailedRequests: process.env.RATE_LIMIT_SKIP_FAILED === 'true'
      },

      // Security configuration
      security: {
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        csrfEnabled: process.env.CSRF_ENABLED === 'true'
      },

      // Feature flags
      features: {
        enableCaching: process.env.ENABLE_CACHING !== 'false',
        enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
        enableMetrics: process.env.ENABLE_METRICS !== 'false',
        enableSearchIndex: process.env.ENABLE_SEARCH_INDEX !== 'false',
        enableImageOptimization: process.env.ENABLE_IMAGE_OPTIMIZATION === 'true'
      }
    };

    this.validateConfig();
  }

  validateConfig() {
    const errors = [];

    // Only validate in non-test environments
    if (process.env.NODE_ENV === 'test') {
      logger.info('Configuration validation skipped for test environment');
      return;
    }

    // Validate required environment variables (service-agnostic)
    const required = [
      'NODE_ENV'
    ];

    // Only require PORT in production/development
    if (process.env.NODE_ENV !== 'test') {
      required.push('PORT');
    }

    for (const key of required) {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key}`);
      }
    }

    // Validate numeric values
    if (this.config.pagination.defaultLimit > this.config.pagination.maxLimit) {
      errors.push('Default page limit cannot be greater than max page limit');
    }

    if (this.config.validation.minPasswordLength < 6) {
      errors.push('Minimum password length must be at least 6 characters');
    }

    if (errors.length > 0) {
      logger.error('Configuration validation failed', { errors });
      // Skip validation in test environment
      if (process.env.NODE_ENV !== 'test') {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
      }
    }

    logger.info('Configuration validated successfully');
  }

  get(path) {
    const keys = path.split('.');
    let current = this.config;

    for (const key of keys) {
      if (current[key] === undefined) {
        logger.warn(`Configuration key not found: ${path}`);
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.config;

    for (const key of keys) {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
    logger.debug(`Configuration updated: ${path} = ${value}`);
  }

  // Specific getters for commonly used configs
  getDatabaseConfig() {
    return this.config.database;
  }

  getCacheConfig() {
    return this.config.cache;
  }

  getPerformanceConfig() {
    return this.config.performance;
  }

  getUploadConfig() {
    return this.config.upload;
  }

  getPaginationConfig() {
    return this.config.pagination;
  }

  getValidationConfig() {
    return this.config.validation;
  }

  getSearchConfig() {
    return this.config.search;
  }

  getRateLimitingConfig() {
    return this.config.rateLimiting;
  }

  getSecurityConfig() {
    return this.config.security;
  }

  getFeatureFlags() {
    return this.config.features;
  }

  isFeatureEnabled(feature) {
    return this.config.features[feature] === true;
  }

  // Get environment-specific configurations
  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }

  // Get all configuration for debugging
  getAll() {
    return this.config;
  }

  // Get configuration summary (without sensitive data)
  getSummary() {
    return {
      environment: process.env.NODE_ENV,
      features: this.config.features,
      limits: {
        pagination: this.config.pagination,
        validation: this.config.validation,
        upload: {
          maxFileSize: this.config.upload.maxFileSize,
          allowedTypes: this.config.upload.allowedTypes
        }
      }
    };
  }
}

// Create singleton instance
const configManager = new ConfigManager();

module.exports = { ConfigManager, configManager };
