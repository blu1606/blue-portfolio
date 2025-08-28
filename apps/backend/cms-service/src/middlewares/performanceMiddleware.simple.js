// src/middlewares/performanceMiddleware.js
const os = require('os');

// Simple request timing middleware without header conflicts
const requestTimer = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Started`);
  
  // Monitor completion
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log completion with timing
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
    
    // Log slow requests (>1 second)
    if (duration > 1000) {
      console.warn(`🐌 Slow request detected: ${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

// Memory monitoring middleware
const memoryMonitor = (req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Log high memory usage
  if (memUsage.heapUsed / memUsage.heapTotal > 0.8) {
    console.warn(`⚠️  High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
  }
  
  next();
};

// Request rate monitoring
const requestRateMonitor = (() => {
  const requestCounts = new Map();
  const windowSize = 60000; // 1 minute window
  
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
      if (now - data.timestamp > windowSize) {
        requestCounts.delete(key);
      }
    }
    
    // Track current request
    const current = requestCounts.get(ip) || { count: 0, timestamp: now };
    if (now - current.timestamp > windowSize) {
      current.count = 1;
      current.timestamp = now;
    } else {
      current.count++;
    }
    requestCounts.set(ip, current);
    
    // Warn about high request rates (>100 requests per minute)
    if (current.count > 100) {
      console.warn(`🚨 High request rate from IP ${ip}: ${current.count} requests/minute`);
    }
    
    next();
  };
})();

// Query performance optimizer
const queryOptimizer = (req, res, next) => {
  // Add query performance tracking to request object
  req.queryPerf = {
    start: Date.now(),
    queries: []
  };
  
  next();
};

// Cache performance monitor
const cachePerformance = (req, res, next) => {
  // Add cache performance tracking to request object
  req.cachePerf = {
    hits: 0,
    misses: 0,
    operations: []
  };
  
  next();
};

// Health monitoring
const healthMonitor = (req, res, next) => {
  // Basic health metrics collection
  req.healthMetrics = {
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    nodeVersion: process.version
  };
  
  next();
};

module.exports = {
  requestTimer,
  memoryMonitor,
  requestRateMonitor,
  queryOptimizer,
  cachePerformance,
  healthMonitor
};
