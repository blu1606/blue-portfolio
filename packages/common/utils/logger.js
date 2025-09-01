// packages/common/utils/logger.js
/**
 * Centralized logging utility with different log levels
 * Shared across all microservices
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'   // Reset
};

class Logger {
  constructor(module = 'Service') {
    this.module = module;
    this.level = process.env.LOG_LEVEL || 'INFO';
    this.currentLevel = LOG_LEVELS[this.level] || LOG_LEVELS.INFO;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.RESET;
    
    const baseMessage = `${color}[${timestamp}] [${level}] [${this.module}] ${message}${reset}`;
    
    if (Object.keys(meta).length > 0) {
      return `${baseMessage}\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return baseMessage;
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= this.currentLevel;
  }

  error(message, meta = {}) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('INFO')) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('DEBUG')) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  // Database operation logging
  database(operation, table, meta = {}) {
    this.debug(`Database ${operation} on ${table}`, meta);
  }

  // Cache operation logging
  cache(operation, key, meta = {}) {
    this.debug(`Cache ${operation} for key: ${key}`, meta);
  }

  // Performance logging
  performance(operation, duration, meta = {}) {
    const level = duration > 1000 ? 'WARN' : 'INFO';
    this[level.toLowerCase()](`Performance: ${operation} took ${duration.toFixed(2)}ms`, meta);
  }

  // Request logging
  request(method, url, statusCode, duration, meta = {}) {
    const level = statusCode >= 400 ? 'ERROR' : statusCode >= 300 ? 'WARN' : 'INFO';
    this[level.toLowerCase()](`${method} ${url} - ${statusCode} - ${duration.toFixed(2)}ms`, meta);
  }

  // Security logging
  security(event, meta = {}) {
    this.warn(`Security: ${event}`, meta);
  }
}

// Create singleton instances for different modules
const createLogger = (module) => new Logger(module);

module.exports = {
  Logger,
  createLogger,
  // Default logger
  logger: new Logger()
};
