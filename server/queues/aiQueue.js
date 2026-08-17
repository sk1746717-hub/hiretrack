import { Queue } from "bullmq";
import { redisClient, getIsRedisConnected } from "../config/redis.js";

let aiQueueInstance = null;

export const getAiQueue = () => {
  if (!getIsRedisConnected()) {
    return null;
  }
  if (!aiQueueInstance) {
    try {
      aiQueueInstance = new Queue("ai-processing", {
        connection: redisClient,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: {
            age: 3600, // keep completed jobs for 1 hour
            count: 500,
          },
          removeOnFail: {
            age: 86400, // keep failed jobs for 24 hours
          },
        },
      });
    } catch (error) {
      console.warn("Failed to initialize BullMQ queue:", error.message);
      return null;
    }
  }
  return aiQueueInstance;
};

/**
 * Adds an AI processing task to BullMQ queue.
 * @param {string} taskName - Task type ('match-analysis' | 'interview-kit')
 * @param {Object} payload - Task parameters (candidateId, jobId, etc.)
 * @returns {Promise<{ queued: boolean, jobId?: string }>} Task result status
 */
export const addAiTask = async (taskName, payload) => {
  if (!getIsRedisConnected()) {
    return { queued: false };
  }

  const queue = getAiQueue();
  if (!queue) {
    return { queued: false };
  }

  try {
    const job = await queue.add(taskName, payload);
    return { queued: true, jobId: job.id };
  } catch (error) {
    console.warn(`Failed to add task "${taskName}" to BullMQ queue:`, error.message);
    return { queued: false };
  }
};

export default {
  getAiQueue,
  addAiTask,
};
