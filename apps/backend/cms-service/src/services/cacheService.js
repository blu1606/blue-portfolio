// src/services/cacheService.js

const { promisify } = require('util')

const createCacheService = (redisClient) => {

  const getAsync = promisify(redisClient.get).bind(redisClient);
  const setAsync = promisify(redisClient.set).bind(redisClient);
  const delAsync = promisify(redisClient.del).bind(redisClient);
  const keysAsync = promisify(redisClient.keys).bind(redisClient);

  // Constants
  const DEFAULT_EXPIRY_SECONDS = 3600;
  const STALE_TTL_MULTIPLIER = 1.2;

  /**
   * Lấy dữ liệu từ cache. Nếu hết hạn nhưng vẫn còn, trả về dữ liệu cũ và cập nhật ngầm.
   * @param {string} key - Cache key
   * @param {Function} rebuildFn - Hàm async để lấy dữ liệu mới
   * @param {number} expirySeconds - Thời gian cache tươi (fresh)
   * @returns {Promise<any>} Dữ liệu từ cache hoặc từ hàm rebuildFn
  */

  return {
    getWithStale: async (key, rebuildFn, expirySeconds= DEFAULT_EXPIRY_SECONDS) => {

        try {
          const cachedData = await getAsync(key);

          if (cachedData) {
            const data = JSON.parse(cachedData)
            const currentTime = Date.now();

            // check if data is stale (old but not yet expired from Redis)
            const isStale = (currentTime - data.timestamp) / 1000 > expirySeconds;

            if (isStale) {
              // If stale, rebuild the data in the background
              console.log(`Cache for key ${key} is stale. Rebuilding in the background...`);
              rebuildFn().then( async (newData) => {
                if(newData) {
                  await setAsync(key, JSON.stringify({
                    value: newData,
                    timestamp: Date.now()
                  }), 'EX', expirySeconds*STALE_TTL_MULTIPLIER);
                }
              }).catch(error =>{
                console.error(`Background cache rebuild failed for key ${key}:`, error);
              });
            }
            return data.value;
          }

          // cache miss - rebuild and store
          console.log(`Cache miss for key ${key}. Rebuilding now...`);
          const newData = await rebuildFn();
          if (newData) {
            await setAsync(key, JSON.stringify({
              value: newData,
              timestamp: Date.now()
            }), 'EX', expirySeconds*STALE_TTL_MULTIPLIER);
            return newData;
          }
        } catch (error) {
          console.error(`Cache operation failed for key ${key}:`, error);
          // Fallback to rebuilding directly on error
          return rebuildFn();
        }
    },

    set: async (key, value, expirySeconds = DEFAULT_EXPIRY_SECONDS) => {
      const stringValue = JSON.stringify(value, timestamp=Date.now());
      await setAsync(key, stringValue, 'EX', expirySeconds);
    },

    del: async (key) => {
      await delAsync(key);
    },
    
    delByPattern: async (pattern) => {
      const keys = await keysAsync(pattern);
      if (keys.length > 0) {
        await delAsync(keys);
        console.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    }
  };
};

module.exports = { createCacheService };