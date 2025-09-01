// src/core/BaseService.js
/**
 * Base service class to reduce code duplication in services
 */

const { BadRequestError } = require('common/core/error.response');
const { createLogger } = require('common/utils/logger');
const { CacheHelper } = require('../utils/cacheHelper');

class BaseService {
  constructor(serviceName, repository, cacheService = null) {
    this.serviceName = serviceName;
    this.repository = repository;
    this.logger = createLogger(serviceName);
    this.cacheHelper = cacheService ? new CacheHelper(cacheService) : null;
  }

  // Common validation
  validateId(id, entityName = 'entity') {
    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestError(`Invalid ${entityName} ID.`);
    }
  }

  validateRequiredFields(data, requiredFields) {
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
        throw new BadRequestError(`${field} is required.`);
      }
    }
  }

  // Common CRUD operations with caching
  async findById(id, options = {}) {
    this.validateId(id, this.serviceName.replace('Service', ''));

    if (this.cacheHelper && !options.skipCache) {
      return this.cacheHelper.cacheItem(
        this.serviceName,
        id,
        () => this.repository.findById(id),
        options.ttl
      );
    }

    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new BadRequestError(`${this.serviceName.replace('Service', '')} not found.`);
    }
    return entity;
  }

  async findAll(filters = {}, options = {}) {
    if (this.cacheHelper && !options.skipCache) {
      const cacheKey = this.cacheHelper.generateKey(`${this.serviceName}:list`, filters);
      return this.cacheHelper.getWithFallback(
        cacheKey,
        () => this.repository.findAll(filters),
        options.ttl || 1800
      );
    }

    return this.repository.findAll(filters);
  }

  async create(data, options = {}) {
    const entity = await this.repository.create(data);

    // Invalidate cache
    if (this.cacheHelper) {
      await this.cacheHelper.invalidateAll(this.serviceName);
    }

    this.logger.info(`${this.serviceName.replace('Service', '')} created`, { id: entity.id });
    return entity;
  }

  async update(id, data, options = {}) {
    this.validateId(id, this.serviceName.replace('Service', ''));

    const entity = await this.repository.update(id, data);
    if (!entity) {
      throw new BadRequestError(`${this.serviceName.replace('Service', '')} not found.`);
    }

    // Invalidate cache
    if (this.cacheHelper) {
      await this.cacheHelper.invalidateEntity(this.serviceName, id);
    }

    this.logger.info(`${this.serviceName.replace('Service', '')} updated`, { id });
    return entity;
  }

  async delete(id, options = {}) {
    this.validateId(id, this.serviceName.replace('Service', ''));

    const result = await this.repository.delete(id);

    // Invalidate cache
    if (this.cacheHelper) {
      await this.cacheHelper.invalidateEntity(this.serviceName, id);
    }

    this.logger.info(`${this.serviceName.replace('Service', '')} deleted`, { id });
    return result;
  }

  // Soft delete
  async softDelete(id) {
    this.validateId(id, this.serviceName.replace('Service', ''));

    const result = await this.repository.softDelete(id);

    // Invalidate cache
    if (this.cacheHelper) {
      await this.cacheHelper.invalidateEntity(this.serviceName, id);
    }

    this.logger.info(`${this.serviceName.replace('Service', '')} soft deleted`, { id });
    return result;
  }

  // Common search functionality
  async search(query, options = {}) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    if (this.cacheHelper && !options.skipCache) {
      return this.cacheHelper.cacheSearch(
        this.serviceName,
        query,
        () => this.repository.search(query, options),
        options.ttl || 1800
      );
    }

    return this.repository.search(query, options);
  }

  // Common pagination
  async paginate(filters = {}, pagination = {}) {
    const { limit = 10, offset = 0 } = pagination;

    if (this.cacheHelper) {
      const cacheKey = this.cacheHelper.generateKey(`${this.serviceName}:paginate`, {
        ...filters,
        limit,
        offset
      });
      
      return this.cacheHelper.getWithFallback(
        cacheKey,
        () => this.repository.paginate(filters, { limit, offset }),
        900 // 15 minutes for paginated results
      );
    }

    return this.repository.paginate(filters, { limit, offset });
  }

  // Common count operations
  async count(filters = {}) {
    if (this.cacheHelper) {
      return this.cacheHelper.cacheCount(
        this.serviceName,
        () => this.repository.count(filters),
        600 // 10 minutes for counts
      );
    }

    return this.repository.count(filters);
  }

  // Logging helpers
  logInfo(message, meta = {}) {
    this.logger.info(message, meta);
  }

  logError(message, meta = {}) {
    this.logger.error(message, meta);
  }

  logWarn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  // Performance timing
  async withTiming(operation, fn) {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.logger.performance(`${this.serviceName}:${operation}`, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.performance(`${this.serviceName}:${operation}:ERROR`, duration);
      throw error;
    }
  }
}

module.exports = { BaseService };
