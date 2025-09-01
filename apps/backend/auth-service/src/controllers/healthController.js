// src/controllers/healthController.js
const asyncHandler = require('common/helpers/asyncHandler');
const { SuccessResponse } = require('common/core/success.response');

const createHealthController = (container) => {
  return {
    healthCheck: asyncHandler(async (req, res) => {
      // Check critical dependencies
      const healthStatus = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      };

      // Test database connection
      try {
        const supabase = container.get('supabase');
        const { data, error } = await supabase.from('users').select('count').limit(1);
        healthStatus.database = error ? 'ERROR' : 'OK';
        if (error) {
          healthStatus.databaseError = error.message;
        }
      } catch (error) {
        healthStatus.database = 'ERROR';
        healthStatus.databaseError = error.message;
      }

      const statusCode = healthStatus.database === 'OK' ? 200 : 503;

      new SuccessResponse({
        message: 'Health check completed',
        metadata: healthStatus
      }).send(res, statusCode);
    }),

    getMetrics: asyncHandler(async (req, res) => {
      const metrics = {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        environment: process.env.NODE_ENV || 'development'
      };

      new SuccessResponse({
        message: 'Metrics retrieved successfully',
        metadata: metrics
      }).send(res);
    })
  };
};

module.exports = { createHealthController };
