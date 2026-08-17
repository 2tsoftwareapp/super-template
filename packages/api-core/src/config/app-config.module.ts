import { Global, Module } from '@nestjs/common';
import { loadEnvFiles } from '@repo/env-loader';

import { APP_ENVIRONMENT } from './config.constants';
import { validateEnvironment } from './env.schema';
import { EnvironmentService } from './environment.service';

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
  ],
  exports: [APP_ENVIRONMENT, EnvironmentService],
})
export class AppConfigModule {}
