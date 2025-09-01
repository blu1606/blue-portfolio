// packages/common/utils/cacheHelper.js
/**
 * Centralized cache operations helper
 * Shared across all microservices
 */

const { createLogger } = require('./logger');

const logger = createLogger('CacheHelper');

class CacheHelper {
  constructor(cacheService) {
    this.cache = cacheService;
  }

  // Generate consistent cache keys
  generateKey(prefix, params = {}, options = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    const baseKey = `${prefix}:${JSON.stringify(sortedParams)}`;
    
    if (options.version) {
      return `${baseKey}:v${options.version}`;
    }
    
    return baseKey;
  }

  // Get with fallback function
  async getWithFallback(key, fallbackFn, ttl = 3600) {
    try {
      const cached = await this.cache.get(key);
      
      if (cached) {
        logger.cache('HIT', key);
        return JSON.parse(cached);
      }

      logger.cache('MISS', key);
      const fresh = await fallbackFn();
      
      if (fresh !== null && fresh !== undefined) {
        await this.cache.setWithTTL(key, JSON.stringify(fresh), ttl);
        logger.cache('SET', key, { ttl });
      }
      
      return fresh;
    } catch (error) {
      logger.error('Cache operation failed', { key, error: error.message });
      // Fallback to direct execution on cache error
      return await fallbackFn();
    }
  }

  // Invalidate cache patterns
  async invalidatePattern(pattern) {
    try {
      await this.cache.delPattern(pattern);
      logger.cache('INVALIDATE_PATTERN', pattern);
    } catch (error) {
      logger.error('Cache invalidation failed', { pattern, error: error.message });
    }
  }

  // Batch operations
  async batchGet(keys) {
    const results = {};
    
    for (const key of keys) {
      try {
        const cached = await this.cache.get(key);
        if (cached) {
          results[key] = JSON.parse(cached);
          logger.cache('BATCH_HIT', key);
        } else {
          logger.cache('BATCH_MISS', key);
        }
      } catch (error) {
        logger.error('Batch cache get failed', { key, error: error.message });
      }
    }
    
    return results;
  }

  async batchSet(keyValuePairs, ttl = 3600) {
    for (const [key, value] of Object.entries(keyValuePairs)) {
      try {
        await this.cache.setWithTTL(key, JSON.stringify(value), ttl);
        logger.cache('BATCH_SET', key, { ttl });
      } catch (error) {
        logger.error('Batch cache set failed', { key, error: error.message });
      }
    }
  }

  // Cache warming
  async warmCache(strategies) {
    logger.info('Starting cache warming');
    
    for (const strategy of strategies) {
      try {
        const { key, generator, ttl } = strategy;
        const data = await generator();
        await this.cache.setWithTTL(key, JSON.stringify(data), ttl || 3600);
        logger.cache('WARM', key);
      } catch (error) {
        logger.error('Cache warming failed', { strategy, error: error.message });
      }
    }
    
    logger.info('Cache warming completed');
  }

  // Common cache patterns
  async cacheList(prefix, fetcher, ttl = 1800) {
    const key = `list:${prefix}`;
    return this.getWithFallback(key, fetcher, ttl);
  }

  async cacheItem(prefix, id, fetcher, ttl = 3600) {
    const key = `item:${prefix}:${id}`;
    return this.getWithFallback(key, fetcher, ttl);
  }

  async cacheCount(prefix, fetcher, ttl = 900) {
    const key = `count:${prefix}`;
    return this.getWithFallback(key, fetcher, ttl);
  }

  async cacheSearch(prefix, query, fetcher, ttl = 1800) {
    const key = this.generateKey(`search:${prefix}`, { query });
    return this.getWithFallback(key, fetcher, ttl);
  }

  // Invalidation helpers
  async invalidateEntity(entityType, entityId) {
    const patterns = [
      `item:${entityType}:${entityId}`,
      `list:${entityType}*`,
      `count:${entityType}*`,
      `search:${entityType}*`
    ];

    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }

  async invalidateAll(entityType) {
    await this.invalidatePattern(`*:${entityType}*`);
  }
}

module.exports = { CacheHelper };
