import { Worker } from "bullmq";
import { redisClient, getIsRedisConnected } from "../config/redis.js";
import { analyzeAndPersistCandidateMatch, generateAndPersistInterviewKit } from "../services/aiIntelligenceService.js";

let workerInstance = null;

export const initAiWorker = () => {
  if (!getIsRedisConnected()) {
    console.log("Redis is offline. Skipping BullMQ worker initialization.");
    return null;
  }

  if (workerInstance) {
    return workerInstance;
  }

  try {
    workerInstance = new Worker(
      "ai-processing",
      async (job) => {
        console.log(`[BullMQ Worker] Processing job ${job.id} of type '${job.name}'...`);
        const { candidateId, jobId } = job.data || {};

        if (job.name === "match-analysis") {
          const result = await analyzeAndPersistCandidateMatch(candidateId, jobId);
          console.log(`[BullMQ Worker] Job ${job.id} 'match-analysis' completed successfully.`);
          return result;
        } else if (job.name === "interview-kit") {
          const result = await generateAndPersistInterviewKit(candidateId, jobId);
          console.log(`[BullMQ Worker] Job ${job.id} 'interview-kit' completed successfully.`);
          return result;
        } else {
          throw new Error(`Unknown job type: ${job.name}`);
        }
      },
      {
        connection: redisClient,
        concurrency: 5,
      }
    );

    workerInstance.on("completed", (job) => {
      console.log(`[BullMQ Worker] Task ${job.id} completed.`);
    });

    workerInstance.on("failed", (job, err) => {
      console.error(`[BullMQ Worker] Task ${job?.id} failed:`, err.message);
    });

    workerInstance.on("error", (err) => {
      console.warn("[BullMQ Worker] Worker connection warning:", err.message);
    });

    console.log("[BullMQ Worker] AI Processing Worker started.");
    return workerInstance;
  } catch (error) {
    console.warn("Failed to initialize BullMQ Worker:", error.message);
    return null;
  }
};

export default {
  initAiWorker,
};
