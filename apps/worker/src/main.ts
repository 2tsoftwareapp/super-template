import type { INestApplicationContext } from "@nestjs/common";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SchedulerRegistry } from "@nestjs/schedule";
import { EnvironmentService } from "@repo/api-runtime";

import { WorkerModule } from "./worker.module";

const logger = new Logger("WorkerBootstrap");
const workerRole = "background-worker";

interface WorkerEvent {
  event: string;
  status: "failed" | "ready" | "shutdown";
  signal?: string;
  cronJobCount?: number;
  appEnv?: string;
  error?: string;
}

const logWorkerEvent = (event: WorkerEvent): void => {
  logger.log(
    JSON.stringify({
      ...event,
      pid: process.pid,
      role: workerRole,
    }),
  );
};

/**
 * Start the background worker as a Nest application context.
 * The process owns scheduled feature callbacks and intentionally has no HTTP listener.
 */
export async function bootstrap(): Promise<void> {
  let app: INestApplicationContext | undefined;

  try {
    app = await NestFactory.createApplicationContext(WorkerModule, {
      bufferLogs: true,
      abortOnError: false,
    });
    app.flushLogs();
    const scheduler = app.get(SchedulerRegistry);
    const environmentService = app.get(EnvironmentService);
    const cronJobCount = scheduler.getCronJobs().size;
    let closing = false;

    const shutdown = async (signal: string): Promise<void> => {
      if (closing) return;
      closing = true;
      logWorkerEvent({ event: "worker.shutdown", status: "shutdown", signal });
      await app?.close();
      logWorkerEvent({ event: "worker.shutdown.complete", status: "shutdown", signal });
    };

    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));

    logWorkerEvent({
      appEnv: environmentService.appEnv,
      cronJobCount,
      event: "worker.startup",
      status: "ready",
    });
  } catch (error: unknown) {
    await app?.close().catch(() => undefined);
    throw error;
  }
}

void bootstrap().catch((error: unknown) => {
  logWorkerEvent({
    error: error instanceof Error ? error.message : String(error),
    event: "worker.startup",
    status: "failed",
  });
  logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
});
