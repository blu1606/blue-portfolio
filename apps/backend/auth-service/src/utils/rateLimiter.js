// src/utils/rateLimiter.js
const { BadRequestError } = require('common/core/error.response');

// Sử dụng Map() để mô phỏng một interface Redis đơn giản
class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.dailyRequests = new Map();
  }
  async checkAttemptLimit(email, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const key = `attempts:${email}`;
    const userAttempts = this.attempts.get(key) || { count: 0, startTime: now };
    if (now - userAttempts.startTime > windowMs) {
      this.attempts.set(key, { count: 1, startTime: now });
      return true;
    }
    if (userAttempts.count >= maxAttempts) {
      const remainingTime = Math.ceil((windowMs - (now - userAttempts.startTime)) / 1000);
      throw new BadRequestError(`Too many attempts. Please try again in ${remainingTime} seconds.`);
    }
    this.attempts.set(key, {
      count: userAttempts.count + 1,
      startTime: userAttempts.startTime
    });
    return true;
  }
  async checkDailyLimit(email, maxRequests = 10) {
    const today = new Date().toDateString();
    const key = `daily:${email}:${today}`;
    const dailyCount = this.dailyRequests.get(key) || 0;
    if (dailyCount >= maxRequests) {
      throw new BadRequestError('Daily OTP request limit exceeded. Please try again tomorrow.');
    }
    this.dailyRequests.set(key, dailyCount + 1);
    return true;
  }
  clearAttempts(email) {
    const key = `attempts:${email}`;
    this.attempts.delete(key);
  }
}

module.exports = new RateLimiter();