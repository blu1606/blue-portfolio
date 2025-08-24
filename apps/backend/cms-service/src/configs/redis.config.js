// src/configs/redis.config.js
const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('connect', () => {
      console.log('Redis client connected successfully!');
    });

    this.client.on('error', (err) => {
      console.error('Redis client connection error:', err);
    });

    // Promisify các hàm để có thể dùng async/await
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  static getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }
}

module.exports = RedisClient.getInstance().client;