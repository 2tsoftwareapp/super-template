import { Controller, Get, HttpStatus, Inject, Logger } from "@nestjs/common";

import { DatabaseService } from "./shared/database.service";
import { AppError, ERROR_CODES } from "./shared/errors";
import { Public } from "./shared/public.decorator";

/** Readiness: answers 200 only when the API can reach Postgres. */
@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Public()
  @Get()
  async check(): Promise<{ status: "ok"; database: "ok" }> {
    try {
      await this.database.ping();
    } catch (error) {
      this.logger.error("Database ping failed", error instanceof Error ? error.stack : error);
      throw new AppError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        "Database unreachable",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: "ok", database: "ok" };
  }
}
