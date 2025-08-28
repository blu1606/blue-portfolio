// packages/common/services/baseService.js
/**
 * Base service class with common functionality
 * Shared across all microservices
 */

const { createLogger } = require('../utils/logger');
const { DatabaseErrorHandler } = require('../utils/databaseErrorHandler');
const { CommonUtils } = require('../utils/commonUtils');

class BaseService {
  constructor(serviceName = 'BaseService') {
    this.logger = createLogger(serviceName);
    this.serviceName = serviceName;
  }

  // Common validation methods
  validateRequired(data, requiredFields) {
    const missing = [];
    requiredFields.forEach(field => {
      if (!data[field] && data[field] !== 0) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  validateEmail(email) {
    if (!CommonUtils.isEmail(email)) {
      throw new Error('Invalid email format');
    }
  }

  validateUUID(id, fieldName = 'id') {
    if (!CommonUtils.isUUID(id)) {
      throw new Error(`Invalid ${fieldName} format`);
    }
  }

  // Common data processing methods
  sanitizeInput(data, allowedFields) {
    return CommonUtils.pick(data, allowedFields);
  }

  processSearchQuery(query, minLength = 2, maxLength = 100) {
    if (!query || typeof query !== 'string') {
      return null;
    }

    const trimmed = query.trim();
    if (trimmed.length < minLength || trimmed.length > maxLength) {
      throw new Error(`Search query must be between ${minLength} and ${maxLength} characters`);
    }

    return trimmed;
  }

  processPagination(page = 1, limit = 10, maxLimit = 100) {
    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit)));
    const offset = (parsedPage - 1) * parsedLimit;

    return {
      page: parsedPage,
      limit: parsedLimit,
      offset
    };
  }

  // Common error handling
  async executeWithErrorHandling(operation, fn) {
    try {
      this.logger.debug(`Starting ${operation}`);
      const result = await fn();
      this.logger.debug(`Completed ${operation}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed ${operation}`, { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  // Database operation helpers
  async findById(repository, id, entityName = 'entity') {
    this.validateUUID(id);
    
    return DatabaseErrorHandler.findById(entityName, id, async () => {
      const entity = await repository.findById(id);
      if (!entity) {
        throw new Error(`${CommonUtils.capitalize(entityName)} not found`);
      }
      return entity;
    });
  }

  async findAll(repository, options = {}, entityName = 'entities') {
    const { page, limit, ...filters } = options;
    const pagination = this.processPagination(page, limit);

    return DatabaseErrorHandler.findAll(entityName, async () => {
      return await repository.findAll({
        ...filters,
        ...pagination
      });
    });
  }

  async create(repository, data, entityName = 'entity') {
    return DatabaseErrorHandler.create(entityName, data, async () => {
      return await repository.create(data);
    });
  }

  async update(repository, id, data, entityName = 'entity') {
    this.validateUUID(id);

    return DatabaseErrorHandler.update(entityName, id, async () => {
      const updated = await repository.update(id, data);
      if (!updated) {
        throw new Error(`${CommonUtils.capitalize(entityName)} not found`);
      }
      return updated;
    });
  }

  async delete(repository, id, entityName = 'entity') {
    this.validateUUID(id);

    return DatabaseErrorHandler.delete(entityName, id, async () => {
      const deleted = await repository.delete(id);
      if (!deleted) {
        throw new Error(`${CommonUtils.capitalize(entityName)} not found`);
      }
      return deleted;
    });
  }

  async count(repository, filters = {}, entityName = 'entities') {
    return DatabaseErrorHandler.count(entityName, async () => {
      return await repository.count(filters);
    });
  }

  // Response formatting
  formatResponse(data, meta = {}) {
    return {
      data,
      meta: {
        timestamp: new Date().toISOString(),
        service: this.serviceName,
        ...meta
      }
    };
  }

  formatListResponse(items, pagination = {}, meta = {}) {
    return this.formatResponse(items, {
      pagination,
      count: items.length,
      ...meta
    });
  }

  formatErrorResponse(error, context = {}) {
    this.logger.error('Service error', { 
      error: error.message,
      context,
      stack: error.stack 
    });

    return {
      error: {
        message: error.message,
        service: this.serviceName,
        timestamp: new Date().toISOString(),
        context
      }
    };
  }

  // Utility methods
  async withRetry(fn, attempts = 3, delay = 1000) {
    return CommonUtils.retry(fn, attempts, delay);
  }

  async withTimeout(fn, timeoutMs = 30000) {
    return CommonUtils.timeout(fn(), timeoutMs);
  }

  createSlug(text) {
    return CommonUtils.slugify(text);
  }

  validateAndSanitize(data, schema) {
    // This would integrate with a validation library like Joi or Yup
    // For now, basic implementation
    const sanitized = {};
    
    Object.keys(schema).forEach(key => {
      const field = schema[key];
      const value = data[key];

      if (field.required && (!value && value !== 0)) {
        throw new Error(`${key} is required`);
      }

      if (value !== undefined && value !== null) {
        if (field.type === 'string' && field.sanitize) {
          sanitized[key] = CommonUtils.sanitizeHtml(value);
        } else if (field.type === 'string' && field.trim) {
          sanitized[key] = value.trim();
        } else {
          sanitized[key] = value;
        }
      }
    });

    return sanitized;
  }

  // Caching helpers (to be used with cache service)
  generateCacheKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${this.serviceName}:${prefix}:${JSON.stringify(sortedParams)}`;
  }
}

module.exports = { BaseService };
