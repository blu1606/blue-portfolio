// src/utils/responseHelper.js
const { SuccessResponse, CREATED } = require('common/core/success.response.js');

/**
 * Response Helper Utilities
 * Standardized response patterns for consistency
 */

class ResponseHelper {
  static success(res, message, metadata = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(metadata && { metadata })
    });
  }

  static created(res, message, metadata = null) {
    return ResponseHelper.success(res, message, metadata, 201);
  }

  static error(res, message, statusCode = 400, errors = null) {
    const response = {
      success: false,
      message
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
  }

  static handleError(res, error) {
    // Handle known error types with statusCode
    if (error.statusCode) {
      return ResponseHelper.error(res, error.message, error.statusCode);
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return ResponseHelper.error(res, 'Validation failed', 400, error.details);
    }
    
    // Default to 500 for unknown errors
    console.error('Unhandled error:', error);
    return ResponseHelper.error(res, 'Internal server error', 500);
  }

  static paginatedResponse(res, message, data, total, limit, offset) {
    const metadata = {
      data,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
    
    return ResponseHelper.success(res, message, metadata);
  }
}

module.exports = { ResponseHelper };
