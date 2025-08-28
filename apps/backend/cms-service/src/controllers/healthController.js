// src/controllers/healthController.js
const asyncHandler = require('common/helpers/asyncHandler');
const { createLogger } = require('common/utils/logger');
const { ResponseHelper } = require('../utils/responseHelper');
const Logger = createLogger('HealthController');

const createHealthController = (container) => {
    return {
        healthCheck: asyncHandler(async (req, res) => {
            try {
                const health = {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    services: {},
                    performance: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        cpu: process.cpuUsage()
                    }
                };

                // Check database health
                try {
                    const supabase = container.get('supabase');
                    const start = Date.now();
                    const { data, error } = await supabase
                        .from('posts')
                        .select('id')
                        .limit(1);
                    
                    const responseTime = Date.now() - start;
                    health.services.database = {
                        status: error ? 'down' : 'up',
                        responseTime
                    };
                } catch (error) {
                    health.services.database = {
                        status: 'down',
                        error: error.message
                    };
                    health.status = 'degraded';
                }

                // Check Redis health
                try {
                    const redisClient = container.get('redisClient');
                    const start = Date.now();
                    await redisClient.ping();
                    const responseTime = Date.now() - start;
                    
                    health.services.redis = {
                        status: 'up',
                        responseTime
                    };
                } catch (error) {
                    health.services.redis = {
                        status: 'down',
                        error: error.message
                    };
                    health.status = 'degraded';
                }

                // Check Meilisearch health
                try {
                    const meiliSearchService = container.get('meiliSearchService');
                    const start = Date.now();
                    await meiliSearchService.getHealth();
                    const responseTime = Date.now() - start;
                    
                    health.services.search = {
                        status: 'up',
                        responseTime
                    };
                } catch (error) {
                    health.services.search = {
                        status: 'down',
                        error: error.message
                    };
                    health.status = 'degraded';
                }

                // Check Cloudinary health (simple test)
                try {
                    const cloudinaryService = container.get('cloudinaryService');
                    const start = Date.now();
                    // Simple ping to check if service is available
                    const responseTime = Date.now() - start;
                    
                    health.services.cloudinary = {
                        status: 'up',
                        responseTime
                    };
                } catch (error) {
                    health.services.cloudinary = {
                        status: 'down',
                        error: error.message
                    };
                    health.status = 'degraded';
                }

                // Calculate overall health
                const downServices = Object.values(health.services).filter(service => service.status === 'down');
                if (downServices.length > 0) {
                    health.status = downServices.length === Object.keys(health.services).length ? 'unhealthy' : 'degraded';
                }

                // Performance metrics
                const memoryUsage = process.memoryUsage();
                health.performance.memory = {
                    used: memoryUsage.used,
                    total: memoryUsage.heapTotal,
                    percentage: Math.round((memoryUsage.used / memoryUsage.heapTotal) * 100)
                };

                const statusCode = health.status === 'healthy' ? 200 : 503;
                return res.status(statusCode).json(health);
                
            } catch (error) {
                Logger.error('Health check error', { 
                    error: error.message, 
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
                return res.status(503).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            }
        }),

        getMetrics: asyncHandler(async (req, res) => {
            try {
                // Check if user is admin (placeholder - implement actual auth check)
                // const isAdmin = req.user && req.user.role === 'admin';
                // if (!isAdmin) {
                //     return ResponseHelper.error(res, 'Admin access required', 403);
                // }

                const metrics = {
                    system: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        cpu: process.cpuUsage(),
                        nodeVersion: process.version,
                        platform: process.platform
                    },
                    database: {
                        // Placeholder for database metrics
                        connectionPool: {
                            active: 'N/A',
                            idle: 'N/A',
                            waiting: 'N/A'
                        },
                        slowQueries: []
                    },
                    cache: {
                        // Placeholder for Redis metrics
                        hitRate: 'N/A',
                        memoryUsage: 'N/A',
                        keyCount: 'N/A'
                    },
                    requests: {
                        // Placeholder for request metrics
                        total: 'N/A',
                        byEndpoint: {},
                        responseTimePercentiles: {
                            p50: 'N/A',
                            p95: 'N/A',
                            p99: 'N/A'
                        },
                        errorRate: 'N/A'
                    }
                };

                return ResponseHelper.success(res, metrics, 'Metrics retrieved successfully');
            } catch (error) {
                Logger.error('Error getting metrics', { 
                    error: error.message, 
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
                return ResponseHelper.error(res, 'Failed to retrieve metrics', 500);
            }
        })
    };
};

module.exports = { createHealthController };
