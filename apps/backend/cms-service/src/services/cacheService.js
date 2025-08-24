// src/services/cacheService.js
const createCacheService = (redisClient) => {
  return {
    get: async (key) => {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    },

    set: async (key, value, expirySeconds = 3600) => {
      // Mặc định cache 1 giờ (3600 giây)
      const stringValue = JSON.stringify(value);
      await redisClient.set(key, stringValue, 'EX', expirySeconds);
    },

    del: async (key) => {
      await redisClient.del(key);
    },
    
    delByPattern: async (pattern) => {
      const keys = await new Promise((resolve, reject) => {
        redisClient.keys(pattern, (err, keys) => {
          if (err) return reject(err);
          resolve(keys);
        });
      });
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  };
};

module.exports = { createCacheService };