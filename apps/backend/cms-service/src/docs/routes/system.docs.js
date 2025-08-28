// src/docs/routes/system.docs.js
/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: System health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   description: Overall system health status
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Health check timestamp
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [up, down]
 *                         responseTime:
 *                           type: number
 *                           description: Database response time in ms
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [up, down]
 *                         responseTime:
 *                           type: number
 *                           description: Redis response time in ms
 *                     search:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [up, down]
 *                         responseTime:
 *                           type: number
 *                           description: Search service response time in ms
 *                     cloudinary:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [up, down]
 *                         responseTime:
 *                           type: number
 *                           description: Cloudinary response time in ms
 *                 performance:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                           description: Used memory in bytes
 *                         total:
 *                           type: number
 *                           description: Total memory in bytes
 *                         percentage:
 *                           type: number
 *                           description: Memory usage percentage
 *                     cpu:
 *                       type: object
 *                       properties:
 *                         usage:
 *                           type: number
 *                           description: CPU usage percentage
 *                     requests:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           description: Total requests processed
 *                         rps:
 *                           type: number
 *                           description: Requests per second (last minute)
 *                         averageResponseTime:
 *                           type: number
 *                           description: Average response time in ms
 *       503:
 *         description: Service unavailable - some services are down
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/metrics:
 *   get:
 *     summary: System performance metrics (admin only)
 *     tags: [System]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         system:
 *                           type: object
 *                           properties:
 *                             uptime:
 *                               type: number
 *                               description: System uptime in seconds
 *                             memory:
 *                               type: object
 *                               description: Detailed memory usage statistics
 *                             cpu:
 *                               type: object
 *                               description: CPU usage statistics
 *                         database:
 *                           type: object
 *                           properties:
 *                             connectionPool:
 *                               type: object
 *                               description: Database connection pool stats
 *                             slowQueries:
 *                               type: array
 *                               description: Recent slow queries
 *                         cache:
 *                           type: object
 *                           properties:
 *                             hitRate:
 *                               type: number
 *                               description: Cache hit rate percentage
 *                             memoryUsage:
 *                               type: number
 *                               description: Cache memory usage in bytes
 *                             keyCount:
 *                               type: number
 *                               description: Number of cached keys
 *                         requests:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                               description: Total requests processed
 *                             byEndpoint:
 *                               type: object
 *                               description: Request count by endpoint
 *                             responseTimePercentiles:
 *                               type: object
 *                               description: Response time percentiles
 *                             errorRate:
 *                               type: number
 *                               description: Error rate percentage
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
