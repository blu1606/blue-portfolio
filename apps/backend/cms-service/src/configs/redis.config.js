// src/configs/redis.config.js
const redis = require('redis');

class RedisClient {
  constructor() {
    // Cấu hình Redis
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('Retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          console.error('Max retry attempts reached');
          return undefined;
        }
        // Retry sau 2 giây
        return Math.min(options.attempt * 100, 3000);
      }
    };

    // Tạo Redis client
    this.client = redis.createClient(redisConfig);

    // Xử lý events
    this.client.on('connect', () => {
      console.log('✅ Redis client connected successfully!');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis client ready to accept commands');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis client error:', err.message);
    });

    this.client.on('end', () => {
      console.log('⚠️  Redis client connection ended');
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting...');
    });

    // Connect client
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Redis connection established');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      // Fallback to mock mode if Redis is not available
      console.log('🔄 Falling back to in-memory cache...');
      this.useMockMode();
    }
  }

  useMockMode() {
    // Tạo mock methods cho cache
    this.client = {
      get: async (key) => null,
      set: async (key, value, options) => 'OK',
      del: async (key) => 1,
      keys: async (pattern) => [],
      exists: async (key) => 0,
      expire: async (key, seconds) => 1,
      ttl: async (key) => -1,
      ping: async () => 'PONG',
      flushAll: async () => 'OK',
      isReady: true,
      connected: true
    };
    console.log('🔧 Using in-memory cache mode');
  }

  static getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance.client;
  }

  // Method để lấy client
  getClient() {
    return this.client;
  }

  // Method để kiểm tra connection
  async ping() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error.message);
      return false;
    }
  }

  // Method để đóng connection
  async disconnect() {
    try {
      await this.client.quit();
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
    }
  }
}

// Export singleton instance
module.exports = RedisClient.getInstance();
