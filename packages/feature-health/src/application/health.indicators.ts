import { Inject, Injectable } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";
import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { sql } from "drizzle-orm";

@Injectable()
export class AppHealthIndicator {
  constructor(private readonly healthIndicatorService: HealthIndicatorService) {}

  isHealthy(key: string) {
    // Liveness is a process-level check: if the app can execute this code path, the process is up.
    return this.healthIndicatorService.check(key).up();
  }
}

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // Readiness uses a cheap database round-trip so orchestrators can keep traffic away until storage is reachable.
      await this.database.execute(sql`select 1`);
      return indicator.up();
    } catch {
      return indicator.down({ reason: "database query failed" });
    }
  }
}
