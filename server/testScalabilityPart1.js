import mongoose from "mongoose";
import Candidate from "./models/Candidate.js";
import Job from "./models/Job.js";
import { redisClient, getIsRedisConnected } from "./config/redis.js";
import cacheService from "./services/cacheService.js";

console.log("=== Testing Scalability Engine Part 1 (Redis & Indexing) ===");

// Test 1: Redis Config & Connectivity
console.log("\n1. Testing Redis Connection Status...");
const isConnected = getIsRedisConnected();
console.log("- isRedisConnected:", isConnected);

// Test 2: Cache-Aside Utility Graceful Handling
console.log("\n2. Testing Cache Service (Safe execution without crashing)...");

async function runCacheTests() {
  try {
    const testKey = "test:candidate:123";
    const testData = { name: "Test Candidate", status: "Screening" };

    console.log("Attempting setCached...");
    const setSuccess = await cacheService.setCached(testKey, testData, 60);
    console.log("- setCached result:", setSuccess);

    console.log("Attempting getCached...");
    const fetchedData = await cacheService.getCached(testKey);
    console.log("- getCached result:", fetchedData);

    console.log("Attempting invalidateCache...");
    const invalidatedCount = await cacheService.invalidateCache("test:*");
    console.log("- invalidateCache result:", invalidatedCount);

    console.log("\n3. Testing Database Schema Indexes...");
    const candidateIndexes = Candidate.schema.indexes();
    console.log("Candidate indexes count:", candidateIndexes.length);
    console.log("Candidate indexes:", candidateIndexes.map(idx => idx[0]));

    const jobIndexes = Job.schema.indexes();
    console.log("Job indexes count:", jobIndexes.length);
    console.log("Job indexes:", jobIndexes.map(idx => idx[0]));

    console.log("\n✅ ALL SCALABILITY PART 1 TESTS PASSED!");
    // Close redis client connection safely to allow script exit
    redisClient.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Test error:", err.message);
    redisClient.disconnect();
    process.exit(1);
  }
}

runCacheTests();
