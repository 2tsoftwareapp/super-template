import { loadWorkerEnv } from "@lean/config";
import {
  claimJobs,
  completeJob,
  createDatabase,
  failJob,
  type ClaimedJob,
  type Database,
} from "@lean/db";

import { handlers } from "./handlers";
import { log } from "./log";
import { PermanentJobError } from "./permanent-job-error";

const BATCH_SIZE = 5;
const IDLE_SLEEP_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runJob(db: Database, job: ClaimedJob): Promise<void> {
  const handler = handlers[job.type];

  const fields = { jobId: job.id, type: job.type, attempt: job.attempts };

  if (!handler) {
    await failJob(db, job, `No handler for ${job.type}`, false);
    log("error", "job has no handler", fields);
    return;
  }

  try {
    await completeJob(db, job, await handler(job.payload));
    log("info", "job completed", fields);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retryable = !(error instanceof PermanentJobError);

    await failJob(db, job, message, retryable);
    log(retryable ? "warn" : "error", "job failed", { ...fields, retryable, error: message });
  }
}

/** SIGTERM/SIGINT stop claiming; the batch in hand finishes so no row is left PROCESSING. */
async function main(): Promise<void> {
  const runOnce = process.argv.includes("--once");
  const { db, pool } = createDatabase(loadWorkerEnv().DATABASE_URL);
  let stopping = false;
  const stop = () => {
    stopping = true;
    log("info", "stopping after the current batch");
  };

  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);

  log("info", "worker started", { once: runOnce });

  try {
    while (!stopping) {
      const batch = await claimJobs(db, BATCH_SIZE);

      if (batch.length === 0) {
        if (runOnce) {
          return;
        }

        await sleep(IDLE_SLEEP_MS);
        continue;
      }

      for (const job of batch) {
        await runJob(db, job);
      }
    }
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  log("error", "worker crashed", { error: error instanceof Error ? error.stack : String(error) });
  process.exit(1);
});
