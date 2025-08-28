// packages/common/utils/databaseErrorHandler.js
/**
 * Centralized database error handling utility
 * Shared across all microservices
 */

const { createLogger } = require('./logger');
const { BadRequestError, NotFoundError, InternalServerError } = require('../core/error.response');

const logger = createLogger('DatabaseHandler');

class DatabaseErrorHandler {
  static handleError(error, operation, table = 'unknown') {
    // Log the error
    logger.error(`Database error during ${operation} on ${table}`, {
      error: error.message,
      stack: error.stack,
      code: error.code
    });

    // Handle specific database error types
    if (error.code === '23505') { // Unique constraint violation
      throw new BadRequestError('Duplicate entry found.');
    }

    if (error.code === '23503') { // Foreign key constraint violation
      throw new BadRequestError('Referenced record not found.');
    }

    if (error.code === '23502') { // Not null constraint violation
      throw new BadRequestError('Required field is missing.');
    }

    if (error.code === '42P01') { // Table does not exist
      throw new InternalServerError('Database configuration error.');
    }

    if (error.code === '42703') { // Column does not exist
      throw new InternalServerError('Database schema error.');
    }

    // Connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new InternalServerError('Database connection failed.');
    }

    // Default error handling
    throw new InternalServerError(`Database ${operation} failed.`);
  }

  static async executeWithErrorHandling(operation, table, fn) {
    try {
      const result = await fn();
      logger.database(operation, table, { success: true });
      return result;
    } catch (error) {
      this.handleError(error, operation, table);
    }
  }

  static async executeQuery(operation, table, query, params = []) {
    return this.executeWithErrorHandling(operation, table, async () => {
      // This would be implemented with the actual database client
      // For now, it's a placeholder
      logger.debug(`Executing query on ${table}`, { operation, params: params.length });
      throw new Error('Not implemented - should use actual database client');
    });
  }

  // Helper methods for common operations
  static async create(table, data, fn) {
    return this.executeWithErrorHandling('CREATE', table, fn);
  }

  static async findById(table, id, fn) {
    return this.executeWithErrorHandling('FIND_BY_ID', table, fn);
  }

  static async findAll(table, fn) {
    return this.executeWithErrorHandling('FIND_ALL', table, fn);
  }

  static async update(table, id, fn) {
    return this.executeWithErrorHandling('UPDATE', table, fn);
  }

  static async delete(table, id, fn) {
    return this.executeWithErrorHandling('DELETE', table, fn);
  }

  static async count(table, fn) {
    return this.executeWithErrorHandling('COUNT', table, fn);
  }

  static async search(table, query, fn) {
    return this.executeWithErrorHandling('SEARCH', table, fn);
  }
}

module.exports = { DatabaseErrorHandler };
