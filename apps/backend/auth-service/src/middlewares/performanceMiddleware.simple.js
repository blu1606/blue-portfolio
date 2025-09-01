// src/middlewares/performanceMiddleware.simple.js
const requestTimer = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

const memoryMonitor = (req, res, next) => {
  const used = process.memoryUsage();
  
  // Only log if memory usage is high
  if (used.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage:', {
      heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(used.external / 1024 / 1024) + ' MB'
    });
  }
  
  next();
};

const requestRateMonitor = (() => {
  const requests = new Map();
  
  return (req, res, next) => {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${req.ip}_${minute}`;
    
    requests.set(key, (requests.get(key) || 0) + 1);
    
    // Clean old entries
    if (Math.random() < 0.01) { // 1% chance to clean
      const currentMinute = Math.floor(Date.now() / 60000);
      for (const [k] of requests) {
        const [, keyMinute] = k.split('_');
        if (currentMinute - parseInt(keyMinute) > 5) {
          requests.delete(k);
        }
      }
    }
    
    next();
  };
})();

module.exports = {
  requestTimer,
  memoryMonitor,
  requestRateMonitor
};
