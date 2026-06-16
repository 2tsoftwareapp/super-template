import type { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { EnvironmentService } from '@repo/api-core';
import { createDatabaseClient } from './database.types';

export const DATABASE_POOL = Symbol('DATABASE_POOL');
export const DATABASE = Symbol('DATABASE');

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_POOL,
    inject: [EnvironmentService],
    useFactory: (environmentService: EnvironmentService) =>
      new Pool({
        connectionString: environmentService.isTest
          ? environmentService.values.DATABASE_URL_TEST
          : environmentService.values.DATABASE_URL,
      }),
  },
  {
    provide: DATABASE,
    inject: [DATABASE_POOL],
    useFactory: createDatabaseClient,
  },
];
