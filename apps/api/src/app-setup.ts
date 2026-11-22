import type { INestApplication } from "@nestjs/common";

import { AppExceptionFilter } from "./shared/app-exception.filter";

/** Shared by `main.ts` and the e2e tests so both run the same HTTP surface. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new AppExceptionFilter());
}
