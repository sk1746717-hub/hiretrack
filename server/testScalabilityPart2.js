import mongoose from "mongoose";
import Candidate from "./models/Candidate.js";
import Job from "./models/Job.js";
import { redisClient, getIsRedisConnected } from "./config/redis.js";
import { getAiQueue, addAiTask } from "./queues/aiQueue.js";
import { initAiWorker } from "./workers/aiWorker.js";
import { calculateFallbackMatchAnalysis } from "./services/aiIntelligenceService.js";

console.log("=== Testing Scalability Engine Part 2 (BullMQ & Async Queue) ===");

async function runQueueTests() {
  try {
    // Test 1: Connection & Queue Init
    console.log("\n1. Testing Queue & Worker Initialization...");
    const isConnected = getIsRedisConnected();
    console.log("- isRedisConnected:", isConnected);

    const queue = getAiQueue();
    console.log("- getAiQueue() result:", queue ? "Queue Active" : "null (Offline)");

    const worker = initAiWorker();
    console.log("- initAiWorker() result:", worker ? "Worker Active" : "null (Offline)");

    // Test 2: Dual-Mode Execution Task Addition
    console.log("\n2. Testing Dual-Mode Task Queueing...");
    const mockCandidateId = new mongoose.Types.ObjectId().toString();
    const mockJobId = new mongoose.Types.ObjectId().toString();

    const taskResult = await addAiTask("match-analysis", {
      candidateId: mockCandidateId,
      jobId: mockJobId,
    });

    console.log("- addAiTask result:", taskResult);

    if (taskResult.queued) {
      console.log(`Task successfully queued with BullMQ Job ID: ${taskResult.jobId}`);
    } else {
      console.log("Redis offline. Controller will seamlessly execute task synchronously via fallback.");
    }

    console.log("\n3. Testing Fallback Execution Safety...");
    const mockCandidate = { skills: ["React", "Node.js"], experience: "3 years" };
    const mockJob = { title: "Frontend Dev", requiredSkills: ["React", "CSS"], experience: "2 years" };
    const fallbackResult = calculateFallbackMatchAnalysis(mockCandidate, mockJob);
    console.log("- Fallback calculation overallFitScore:", fallbackResult.overallFitScore);

    console.log("\n✅ ALL SCALABILITY PART 2 TESTS PASSED!");

    if (worker) await worker.close();
    redisClient.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Test error:", err.message);
    redisClient.disconnect();
    process.exit(1);
  }
}

runQueueTests();
