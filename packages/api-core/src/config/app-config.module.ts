import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';

import { APP_ENVIRONMENT } from './config.constants';
import { validateEnvironment } from './env.schema';
import { EnvironmentService } from './environment.service';

const envFilePaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(__dirname, '../../../../.env'),
  resolve(__dirname, '../../../.env'),
];

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: envFilePaths,
      validate: validateEnvironment,
    }),
  ],
  providers: [
    {
      provide: APP_ENVIRONMENT,
      useFactory: () => validateEnvironment(process.env),
    },
    EnvironmentService,
  ],
  exports: [APP_ENVIRONMENT, EnvironmentService],
})
export class AppConfigModule {}
