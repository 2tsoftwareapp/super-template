import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SchedulerRegistry } from "@nestjs/schedule";

import { WorkerModule } from "./worker.module";

const logger = new Logger("WorkerBootstrap");

/**
 * Start the background worker as a Nest application context.
 * The process owns scheduled feature callbacks and intentionally has no HTTP listener.
 */
export async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
    abortOnError: false,
  });
  app.flushLogs();
  const scheduler = app.get(SchedulerRegistry);
  const cronJobCount = scheduler.getCronJobs().size;
  let closing = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (closing) return;
    closing = true;
    logger.log(`Worker shutdown requested signal=${signal}`);
    await app.close();
    logger.log("Worker shutdown complete");
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  logger.log(`Worker ready role=background-worker cronJobCount=${cronJobCount}`);
}

void bootstrap().catch((error: unknown) => {
  logger.error("Worker failed to start", error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
