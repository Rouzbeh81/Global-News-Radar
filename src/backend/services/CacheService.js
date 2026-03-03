const Redis = require('ioredis');

class CacheService {
  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
    } else {
      this.memoryCache = new Map();
    }
  }

  async get(key) {
    if (this.redis) {
      try {
        const val = await this.redis.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.error("Redis Get Error:", err);
        return null;
      }
    }
    const entry = this.memoryCache.get(key);
    if (entry && entry.expiry > Date.now()) {
      return entry.value;
    }
    return null;
  }

  async set(key, value, ttlSeconds = 3600) {
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch (err) {
        console.error("Redis Set Error:", err);
      }
    } else {
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttlSeconds * 1000)
      });
    }
  }
}

module.exports = new CacheService();
