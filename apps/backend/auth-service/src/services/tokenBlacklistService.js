// src/services/tokenBlacklistService.js
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');

class TokenBlacklistService {
  constructor() {
    this.redis = null;
    this.memoryStore = new Set(); // Fallback to memory
    
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      console.log('✅ Redis connected for token blacklist');
    } catch (error) {
      console.warn('⚠️ Redis not available, using memory-based token blacklist');
    }
  }

  async blacklistToken(token) {
    try {
      // Decode token to get expiration
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token format');
      }

      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const ttl = Math.max(0, expirationTime - Date.now());

      if (ttl <= 0) {
        // Token already expired, no need to blacklist
        return true;
      }

      const key = `blacklist:${this.hashToken(token)}`;

      if (this.redis) {
        await this.redis.setex(key, Math.ceil(ttl / 1000), '1');
      } else {
        this.memoryStore.add(key);
        // Clean up expired tokens from memory after TTL
        setTimeout(() => {
          this.memoryStore.delete(key);
        }, ttl);
      }

      return true;
    } catch (error) {
      console.error('Error blacklisting token:', error);
      return false;
    }
  }

  async isTokenBlacklisted(token) {
    try {
      const key = `blacklist:${this.hashToken(token)}`;

      if (this.redis) {
        const result = await this.redis.get(key);
        return result !== null;
      } else {
        return this.memoryStore.has(key);
      }
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      // Fail open for availability, but log the error
      return false;
    }
  }

  async blacklistAllUserTokens(userId, issuedBefore) {
    try {
      // Store user session version to invalidate all tokens before this time
      const key = `user_session:${userId}`;
      const sessionVersion = Date.now();

      if (this.redis) {
        await this.redis.set(key, sessionVersion);
      } else {
        // For memory store, we'd need a different approach
        console.warn('Mass token revocation not fully supported with memory store');
      }

      return sessionVersion;
    } catch (error) {
      console.error('Error blacklisting user tokens:', error);
      return false;
    }
  }

  async isUserSessionValid(userId, tokenIssuedAt) {
    try {
      const key = `user_session:${userId}`;

      if (this.redis) {
        const sessionVersion = await this.redis.get(key);
        if (sessionVersion && parseInt(sessionVersion) > tokenIssuedAt * 1000) {
          return false; // Token issued before session invalidation
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking user session:', error);
      return true; // Fail open
    }
  }

  hashToken(token) {
    // Create a short hash of the token for storage efficiency
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  async getBlacklistStats() {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('blacklist:*');
        return {
          blacklistedTokens: keys.length,
          storageType: 'redis'
        };
      } else {
        return {
          blacklistedTokens: this.memoryStore.size,
          storageType: 'memory'
        };
      }
    } catch (error) {
      return {
        blacklistedTokens: 0,
        storageType: 'error',
        error: error.message
      };
    }
  }
}

module.exports = { TokenBlacklistService };
