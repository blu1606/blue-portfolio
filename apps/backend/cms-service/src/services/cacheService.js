// src/services/cacheService.js
const createCacheService = (redisClient) => {
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
  const getWithStale = async (key, rebuildFn, expirySeconds = DEFAULT_EXPIRY_SECONDS) => {
    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const now = Date.now();
        
        // Kiểm tra xem cache có fresh không
        if (parsed.timestamp && (now - parsed.timestamp) < expirySeconds * 1000) {
          return parsed.data;
        }
        
        // Cache stale nhưng vẫn trả về, đồng thời update ngầm
        if (parsed.timestamp && (now - parsed.timestamp) < expirySeconds * STALE_TTL_MULTIPLIER * 1000) {
          // Background refresh
          rebuildFn().then(newData => {
            set(key, newData, expirySeconds).catch(console.error);
          }).catch(console.error);
          
          return parsed.data;
        }
      }

      // Cache miss hoặc hết hạn hoàn toàn - rebuild
      const freshData = await rebuildFn();
      await set(key, freshData, expirySeconds);
      return freshData;

    } catch (error) {
      console.error('Cache getWithStale error:', error);
      // Fallback to direct function call
      return await rebuildFn();
    }
  };

  /**
   * Lưu dữ liệu vào cache
   * @param {string} key - Cache key
   * @param {any} data - Dữ liệu cần cache
   * @param {number} expirySeconds - Thời gian hết hạn (giây)
   */
  const set = async (key, data, expirySeconds = DEFAULT_EXPIRY_SECONDS) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      const staleExpiry = Math.floor(expirySeconds * STALE_TTL_MULTIPLIER);
      await redisClient.set(key, JSON.stringify(cacheData), {
        EX: staleExpiry
      });
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  };

  /**
   * Lấy dữ liệu từ cache (đơn giản)
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Dữ liệu hoặc null
   */
  const get = async (key) => {
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  };

  /**
   * Xóa cache
   * @param {string} key - Cache key
   */
  const del = async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  };

  /**
   * Xóa nhiều cache keys
   * @param {string} pattern - Pattern để tìm keys (ví dụ: "posts:*")
   */
  const delPattern = async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache delPattern error:', error);
      return 0;
    }
  };

  /**
   * Kiểm tra key có tồn tại không
   * @param {string} key - Cache key
   */
  const exists = async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  };

  /**
   * Lấy TTL của key
   * @param {string} key - Cache key
   */
  const ttl = async (key) => {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return -1;
    }
  };

  /**
   * Flush toàn bộ cache
   */
  const flush = async () => {
    try {
      await redisClient.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  };

  return {
    getWithStale,
    get,
    set,
    del,
    delPattern,
    exists,
    ttl,
    flush
  };
};

module.exports = { createCacheService };
