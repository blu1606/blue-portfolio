// src/utils/responseHelper.js
const { SuccessResponse } = require('common/core/success.response');

/**
 * Helper functions for consistent API responses
 */
const responseHelper = {
  /**
   * Send success response with data
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {Object} data - Response data
   * @param {number} statusCode - HTTP status code
   */
  success: (res, message, data = null, statusCode = 200) => {
    return new SuccessResponse({
      message,
      metadata: data
    }).send(res, statusCode);
  },

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {Array} items - Array of items
   * @param {Object} pagination - Pagination info
   */
  paginated: (res, message, items, pagination) => {
    return new SuccessResponse({
      message,
      metadata: {
        items,
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          total: pagination.total || 0,
          totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
        }
      }
    }).send(res);
  },

  /**
   * Send response without metadata
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   */
  message: (res, message) => {
    return new SuccessResponse({
      message
    }).send(res);
  }
};

module.exports = { responseHelper };
