// src/utils/cacheOptimization.js
/**
 * Cache optimization utilities for better performance
 */

class CacheOptimizer {
  constructor(cacheService) {
    this.cache = cacheService;
    this.hitRates = new Map();
    this.accessPatterns = new Map();
  }

  // Smart cache key generation
  generateCacheKey(prefix, params, options = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    const baseKey = `${prefix}:${JSON.stringify(sortedParams)}`;
    
    if (options.includeVersion) {
      return `${baseKey}:v${options.version || 1}`;
    }
    
    return baseKey;
  }

  // Intelligent cache with TTL based on access patterns
  async smartSet(key, value, defaultTTL = 3600) {
    const pattern = this.accessPatterns.get(key);
    let ttl = defaultTTL;

    if (pattern) {
      // Adjust TTL based on access frequency
      const frequency = pattern.count / ((Date.now() - pattern.firstAccess) / 1000 / 60); // per minute
      
      if (frequency > 10) {
        ttl = defaultTTL * 2; // High frequency - cache longer
      } else if (frequency < 1) {
        ttl = defaultTTL / 2; // Low frequency - cache shorter
      }
    }

    await this.cache.setWithTTL(key, value, ttl);
    this.trackAccess(key, 'set');
  }

  // Smart cache retrieval with fallback
  async smartGet(key, fallbackFn, options = {}) {
    try {
      const cached = await this.cache.get(key);
      
      if (cached) {
        this.trackAccess(key, 'hit');
        return JSON.parse(cached);
      }

      // Cache miss - execute fallback
      this.trackAccess(key, 'miss');
      const fresh = await fallbackFn();
      
      if (fresh && !options.skipCache) {
        await this.smartSet(key, JSON.stringify(fresh), options.ttl);
      }
      
      return fresh;
    } catch (error) {
      console.error(`Cache error for key ${key}:`, error);
      
      // Fallback to direct execution on cache error
      return await fallbackFn();
    }
  }

  // Track cache access patterns
  trackAccess(key, type) {
    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || {
      count: 0,
      hits: 0,
      misses: 0,
      firstAccess: now,
      lastAccess: now
    };

    pattern.count++;
    pattern.lastAccess = now;
    
    if (type === 'hit') {
      pattern.hits++;
    } else if (type === 'miss') {
      pattern.misses++;
    }

    this.accessPatterns.set(key, pattern);
    
    // Clean old patterns (older than 1 hour)
    if (this.accessPatterns.size > 1000) {
      this.cleanOldPatterns();
    }
  }

  // Batch cache operations for better performance
  async batchGet(keys, fallbackMap = {}) {
    const results = {};
    const missingKeys = [];

    // Get all cached values
    for (const key of keys) {
      const cached = await this.cache.get(key);
      if (cached) {
        results[key] = JSON.parse(cached);
        this.trackAccess(key, 'hit');
      } else {
        missingKeys.push(key);
        this.trackAccess(key, 'miss');
      }
    }

    // Execute fallbacks for missing keys
    const fallbackPromises = missingKeys.map(async (key) => {
      const fallbackFn = fallbackMap[key];
      if (fallbackFn) {
        const value = await fallbackFn();
        results[key] = value;
        await this.smartSet(key, JSON.stringify(value));
      }
      return { key, value: results[key] };
    });

    await Promise.all(fallbackPromises);
    return results;
  }

  // Cache warming for frequently accessed data
  async warmCache(warmingStrategies) {
    console.log('Starting cache warming...');
    
    for (const strategy of warmingStrategies) {
      try {
        const { key, generator, ttl } = strategy;
        const data = await generator();
        await this.cache.setWithTTL(key, JSON.stringify(data), ttl || 3600);
        console.log(`Warmed cache for key: ${key}`);
      } catch (error) {
        console.error(`Failed to warm cache for strategy:`, error);
      }
    }
    
    console.log('Cache warming completed');
  }

  // Cache statistics and monitoring
  getStats() {
    const stats = {
      totalKeys: this.accessPatterns.size,
      hotKeys: [],
      coldKeys: [],
      overallHitRate: 0
    };

    let totalHits = 0;
    let totalAccesses = 0;

    for (const [key, pattern] of this.accessPatterns.entries()) {
      totalHits += pattern.hits;
      totalAccesses += pattern.count;
      
      const hitRate = pattern.hits / pattern.count;
      const frequency = pattern.count / ((Date.now() - pattern.firstAccess) / 1000 / 60);
      
      if (frequency > 5 && hitRate > 0.8) {
        stats.hotKeys.push({ key, frequency, hitRate });
      } else if (frequency < 0.5 || hitRate < 0.3) {
        stats.coldKeys.push({ key, frequency, hitRate });
      }
    }

    stats.overallHitRate = totalAccesses > 0 ? totalHits / totalAccesses : 0;
    
    // Sort by frequency
    stats.hotKeys.sort((a, b) => b.frequency - a.frequency);
    stats.coldKeys.sort((a, b) => a.frequency - b.frequency);
    
    return stats;
  }

  // Clean old access patterns
  cleanOldPatterns() {
    const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
    
    for (const [key, pattern] of this.accessPatterns.entries()) {
      if (pattern.lastAccess < cutoff) {
        this.accessPatterns.delete(key);
      }
    }
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern) {
    const keys = await this.cache.keys(pattern);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => this.cache.del(key)));
      console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  }

  // Preemptive cache refresh for expiring data
  async refreshExpiring(thresholdMinutes = 5) {
    const threshold = thresholdMinutes * 60 * 1000;
    const now = Date.now();
    
    for (const [key, pattern] of this.accessPatterns.entries()) {
      const timeSinceAccess = now - pattern.lastAccess;
      
      // If frequently accessed and hasn't been accessed recently
      if (pattern.count > 10 && timeSinceAccess > threshold) {
        // This would require knowing the refresh strategy for each key
        // Implementation depends on specific cache refresh strategies
        console.log(`Key ${key} might need refresh`);
      }
    }
  }
}

module.exports = { CacheOptimizer };
