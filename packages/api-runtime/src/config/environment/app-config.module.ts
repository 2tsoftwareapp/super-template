import { Global, Module } from "@nestjs/common";
import { DATABASE_RUNTIME_ENV, type DatabaseRuntimeEnv } from "@repo/api-kernel";
import { loadEnvFiles } from "@repo/env-loader";

import { APP_ENVIRONMENT } from "./config.constants";
import { validateEnvironment } from "./env.schema";
import { EnvironmentService } from "./environment.service";

@Global()
@Module({
  providers: [
    {
      provide: APP_ENVIRONMENT,
      useFactory: () => {
        loadEnvFiles();
        return validateEnvironment(process.env);
      },
    },
    EnvironmentService,
    {
      provide: DATABASE_RUNTIME_ENV,
      inject: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService): DatabaseRuntimeEnv => {
        const databaseUrlTest = environmentService.databaseUrlTest;
        return {
          isTest: environmentService.isTest,
          databaseUrl: environmentService.databaseUrl,
          ...(databaseUrlTest === undefined ? {} : { databaseUrlTest }),
          databaseSkipRlsCheck: environmentService.databaseSkipRlsCheck,
        };
      },
    },
  ],
  exports: [APP_ENVIRONMENT, EnvironmentService, DATABASE_RUNTIME_ENV],
})
export class AppConfigModule {}
