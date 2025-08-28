// packages/common/utils/commonUtils.js
/**
 * Common utility functions
 * Shared across all microservices
 */

const { createLogger } = require('./logger');

const logger = createLogger('CommonUtils');

class CommonUtils {
  // String utilities
  static capitalize(str) {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static slugify(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  static truncate(str, length = 100, suffix = '...') {
    if (!str || typeof str !== 'string') return str;
    if (str.length <= length) return str;
    return str.substring(0, length).trim() + suffix;
  }

  static sanitizeHtml(str) {
    if (!str || typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Array utilities
  static chunk(array, size) {
    if (!Array.isArray(array) || size <= 0) return [];
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  static unique(array, key) {
    if (!Array.isArray(array)) return [];
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  }

  static shuffle(array) {
    if (!Array.isArray(array)) return [];
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Object utilities
  static pick(obj, keys) {
    if (!obj || typeof obj !== 'object') return {};
    const picked = {};
    keys.forEach(key => {
      if (key in obj) {
        picked[key] = obj[key];
      }
    });
    return picked;
  }

  static omit(obj, keys) {
    if (!obj || typeof obj !== 'object') return {};
    const omitted = { ...obj };
    keys.forEach(key => delete omitted[key]);
    return omitted;
  }

  static deepMerge(target, source) {
    if (!target || !source) return target || source || {};
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  // Date utilities
  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  static isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Validation utilities
  static isEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static isUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isUUID(str) {
    if (!str || typeof str !== 'string') return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(str);
  }

  // Number utilities
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Async utilities
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async retry(fn, attempts = 3, delayMs = 1000) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        logger.warn(`Retry attempt ${i + 1} failed, retrying in ${delayMs}ms`, { error: error.message });
        await this.delay(delayMs);
      }
    }
  }

  static async timeout(promise, ms) {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    );
    return Promise.race([promise, timeoutPromise]);
  }

  // Environment utilities
  static getEnv(key, defaultValue = null) {
    return process.env[key] || defaultValue;
  }

  static isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  static isTest() {
    return process.env.NODE_ENV === 'test';
  }

  // Error utilities
  static createError(message, code = 500, details = {}) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
  }

  static safeStringify(obj, space = 0) {
    try {
      return JSON.stringify(obj, null, space);
    } catch (error) {
      logger.warn('Failed to stringify object', { error: error.message });
      return '[Circular Reference]';
    }
  }

  static safeParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      logger.warn('Failed to parse JSON string', { error: error.message });
      return defaultValue;
    }
  }
}

module.exports = { CommonUtils };
