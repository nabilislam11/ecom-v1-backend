import { z } from "zod";
import dotenv from "dotenv";

// Load the .env file if we are not in production
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

// 1. Define the exact shape your .env file MUST have
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  MONGODB_URI: z.string().min(1, { message: "MongoDB URI is required" }),
  //   FRONTEND_URL: z.string().url({ message: "Frontend URL must be a valid URL" }),
  JWT_ACCESS_SECRET: z.string().min(10, { message: "Access secret must be at least 10 chars" }),
  JWT_REFRESH_SECRET: z.string().min(10, { message: "Refresh secret must be at least 10 chars" }),
});

// 2. Validate the environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsedEnv.error.issues);
  process.exit(1); // Kill the app immediately!
}

// 3. Export the clean, validated, strictly-typed variables
export const env = parsedEnv.data;
