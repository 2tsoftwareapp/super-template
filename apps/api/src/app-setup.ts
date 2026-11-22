import type { INestApplication } from "@nestjs/common";

import helmet from "helmet";

import { AppExceptionFilter } from "./shared/app-exception.filter";
import { requestLog } from "./shared/request-log.middleware";

export interface AppSetupOptions {
  /** Browser origins allowed to call the API directly. Empty: no CORS headers. */
  corsOrigins?: string[];
  /** One log line per request; off in tests to keep the output readable. */
  requestLog?: boolean;
}

/** Shared by `main.ts` and the e2e tests so both run the same HTTP surface. */
export function configureApp(app: INestApplication, options: AppSetupOptions = {}): void {
  app.use(helmet());

  if (options.requestLog) {
    app.use(requestLog);
  }

  if (options.corsOrigins && options.corsOrigins.length > 0) {
    app.enableCors({ origin: options.corsOrigins, credentials: true });
  }

  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new AppExceptionFilter());
}
