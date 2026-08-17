import { redisClient, getIsRedisConnected } from "../config/redis.js";

/**
 * Cache-Aside Utility Service
 * Provides resilient, fail-safe caching over Redis with automatic fallback to MongoDB on cache offline.
 */

/**
 * Retrieve cached JSON data by key.
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Parsed JSON object or null if cache miss / Redis offline.
 */
export const getCached = async (key) => {
  if (!getIsRedisConnected()) {
    return null;
  }

  try {
    const rawData = await redisClient.get(key);
    if (!rawData) return null;
    return JSON.parse(rawData);
  } catch (error) {
    console.warn(`Cache getCached error for key "${key}":`, error.message);
    return null;
  }
};

/**
 * Store data in Redis cache with expiration TTL.
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttlSeconds - Expiration time in seconds (default 3600s / 1hr)
 * @returns {Promise<boolean>} Success boolean
 */
export const setCached = async (key, data, ttlSeconds = 3600) => {
  if (!getIsRedisConnected() || data === undefined || data === null) {
    return false;
  }

  try {
    const serialized = JSON.stringify(data);
    if (ttlSeconds > 0) {
      await redisClient.set(key, serialized, "EX", ttlSeconds);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.warn(`Cache setCached error for key "${key}":`, error.message);
    return false;
  }
};

/**
 * Invalidate matching keys by pattern (e.g. "candidate:*").
 * @param {string} pattern - Key pattern matching pattern to delete
 * @returns {Promise<number>} Number of keys invalidated
 */
export const invalidateCache = async (pattern) => {
  if (!getIsRedisConnected()) {
    return 0;
  }

  try {
    let keys = [];
    if (pattern.includes("*")) {
      keys = await redisClient.keys(pattern);
    } else {
      keys = [pattern];
    }

    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.warn(`Cache invalidateCache error for pattern "${pattern}":`, error.message);
    return 0;
  }
};

export default {
  getCached,
  setCached,
  invalidateCache,
};
