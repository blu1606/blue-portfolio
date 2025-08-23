// src/services/auditService.js
const { BadRequestError } = require('common/core/error.response');

const createAuditService = (supabase) => {
  const log = async (action, email, success, details = {}) => {
    if (!action || !email) {
      throw new BadRequestError('Action and email are required');
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      email: email.toLowerCase(),
      success,
      ip_address: details.ipAddress || null,
      user_agent: details.userAgent || null,
      additional_info: details.additionalInfo || null,
      user_id: details.userId || null
    };

    try {
      // TODO: Replace with actual audit logging to database
      // For now, just log to console
      console.log(`[AUDIT LOG] ${action} - ${email} - ${success ? 'SUCCESS' : 'FAILURE'}`);
      
      // Simulate database write
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        success: true,
        logId: `audit_${Date.now()}`,
        timestamp: logEntry.timestamp
      };
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw error for audit failures - they shouldn't break the main flow
      return {
        success: false,
        error: error.message
      };
    }
  };

  const getAuditLogs = async (filters = {}) => {
    try {
      // TODO: Implement actual audit log retrieval
      console.log(`[AUDIT SERVICE] Retrieving logs with filters:`, filters);
      
      return {
        logs: [],
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 50
      };
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      throw error;
    }
  };

  return {
    log,
    getAuditLogs
  };
};

module.exports = { createAuditService };
