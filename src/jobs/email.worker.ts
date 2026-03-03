import { Worker, Job } from "bullmq";
import { Resend } from "resend";
import { env } from "../config/env.js";
import { redisConnection } from "../config/redis.js";

const resend = new Resend(env.RESEND_API_KEY);

interface EmailJobData {
  type: "PASSWORD_RESET" | "WELCOME";
  to: string;
  subject: string;
  html: string;
}

export const emailWorker = new Worker<EmailJobData>(
  "email-queue",
  async (job: Job) => {
    console.log(`⏳ Worker picked up job: Sending ${job.data.type} to ${job.data.to}`);

    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: [job.data.to],
      subject: job.data.subject,
      html: job.data.html,
    });

    // If Resend fails, throw the error so BullMQ knows to retry or fail the job
    if (error) {
      throw new Error(`Resend API Error: ${error.name} - ${error.message}`);
    }

    console.log(`✅ Email sent successfully (ID: ${data?.id})`);
  },
  {
    connection: redisConnection,
    limiter: { max: 9, duration: 1000 },
  },
);

// 👇 THE NEW ADDITIONS: Event listeners for debugging and logging

emailWorker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed successfully!`);
});

emailWorker.on("failed", (job, err) => {
  // This will catch the Resend API error and print it to your console!
  console.error(`❌ Job ${job?.id} failed for ${job?.data.to}. Error:`, err.message);
});

emailWorker.on("error", (err) => {
  // This catches underlying Redis connection errors
  console.error("🚨 BullMQ Worker Error:", err);
});
