// packages/common/utils/repositoryHelper.js
/**
 * Repository helper utilities for consistent error handling and logging
 * Shared across all microservices
 */

const { createLogger } = require('./logger');
const { BadRequestError } = require('../core/error.response');

class RepositoryHelper {
  constructor(tableName) {
    this.tableName = tableName;
    this.logger = createLogger(`${tableName}Repository`);
  }

  async executeQuery(operation, queryFn) {
    try {
      this.logger.debug(`Executing ${operation} on ${this.tableName}`);
      const result = await queryFn();
      this.logger.database(operation, this.tableName, { success: true });
      return result;
    } catch (error) {
      this.logger.error(`Database error during ${operation} on ${this.tableName}`, {
        error: error.message,
        code: error.code
      });
      throw new BadRequestError(`Failed to ${operation.toLowerCase()} ${this.tableName.slice(0, -1)}`);
    }
  }

  handleSupabaseError(error, operation) {
    if (error && error.code === 'PGRST116') {
      return null; // Record not found
    }
    if (error) {
      this.logger.error(`Database error during ${operation} on ${this.tableName}`, {
        error: error.message,
        code: error.code
      });
      throw new BadRequestError(`Failed to ${operation.toLowerCase()} ${this.tableName.slice(0, -1)}`);
    }
  }

  // Static methods for direct usage without instantiation
  static handleDatabaseError(error, operation) {
    const logger = createLogger('Database');
    
    if (error && error.code === 'PGRST116') {
      return null; // Record not found
    }
    
    if (error) {
      logger.error(`Database error during ${operation}`, {
        error: error.message,
        code: error.code,
        operation
      });
      throw new BadRequestError(`Failed to ${operation.toLowerCase()}`);
    }
  }

  static logError(message, error, meta = {}) {
    const logger = createLogger('Repository');
    logger.error(message, { 
      error: error?.message || error,
      ...meta 
    });
  }

  static logInfo(message, meta = {}) {
    const logger = createLogger('Repository');
    logger.info(message, meta);
  }

  static logWarning(message, meta = {}) {
    const logger = createLogger('Repository');
    logger.warn(message, meta);
  }

  logWarning(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  logError(message, meta = {}) {
    this.logger.error(message, meta);
  }

  logInfo(message, meta = {}) {
    this.logger.info(message, meta);
  }
}

module.exports = { RepositoryHelper };
