import { Queue } from "bullmq";
import { redisConnection } from "./redis.js"; // 👈 Import the master connection!

// Create the Inbox using the shared connection
export const emailQueue = new Queue("email-queue", {
  connection: redisConnection,
});

console.log("📦 Redis Email Queue Initialized!");
