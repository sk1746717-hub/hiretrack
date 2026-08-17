import Redis from "ioredis";

let isRedisConnected = false;
let hasLoggedError = false;

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});

redisClient.on("connect", () => {
  isRedisConnected = true;
  hasLoggedError = false;
  console.log("Redis connected successfully.");
});

redisClient.on("ready", () => {
  isRedisConnected = true;
});

redisClient.on("error", (err) => {
  isRedisConnected = false;
  if (!hasLoggedError) {
    console.warn(`Redis Warning: Connection unavailable (${err.message}). Bypassing cache to query MongoDB directly.`);
    hasLoggedError = true;
  }
});

redisClient.on("close", () => {
  isRedisConnected = false;
});

redisClient.on("end", () => {
  isRedisConnected = false;
});

export const getIsRedisConnected = () => isRedisConnected;

export default {
  redisClient,
  getIsRedisConnected,
};
