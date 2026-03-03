import IORedis from "ioredis";
import { env } from "./env.js";

// 1. Define the rules for the connection
const redisOptions = {
  maxRetriesPerRequest: null, // Strictly required by BullMQ
  // Detects if we are using Upstash (rediss://) and allows secure TLS connections
  tls: env.REDIS_URI.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
};

// 2. The ESM TypeScript Fix: Tell TS to ignore its broken constructor types
const Redis = IORedis as any;

// 3. Create the ONE master connection
export const redisConnection = new Redis(env.REDIS_URI, redisOptions);

redisConnection.on("connect", () => {
  console.log("🟢 Connected to Redis!");
});

redisConnection.on("error", (err: any) => {
  console.error("🔴 Redis Connection Error:", err);
});
