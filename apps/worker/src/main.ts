import { claimJobs, completeJob, createDatabase, failJob } from "@lean/db";

import { handlers } from "./handlers";

const BATCH_SIZE = 5;
const IDLE_SLEEP_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required to run the worker");
  }

  return url;
}

async function main(): Promise<void> {
  const runOnce = process.argv.includes("--once");
  const { db, pool } = createDatabase(databaseUrl());

  try {
    for (;;) {
      const batch = await claimJobs(db, BATCH_SIZE);

      if (batch.length === 0) {
        if (runOnce) {
          return;
        }

        await sleep(IDLE_SLEEP_MS);
        continue;
      }

      for (const job of batch) {
        const handler = handlers[job.type];

        if (!handler) {
          await failJob(db, job.id, job.attempts, job.maxAttempts, `No handler for ${job.type}`);
          continue;
        }

        try {
          await completeJob(db, job.id, await handler(job.payload));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);

          await failJob(db, job.id, job.attempts, job.maxAttempts, message);
        }
      }
    }
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
