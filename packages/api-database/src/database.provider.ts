import type { Provider } from '@nestjs/common';

import { EnvironmentService } from '@repo/api-core';
import { Pool, type PoolClient } from 'pg';

import { createDatabaseClient } from './database.types';
import { setTenantContextOnPgClient } from './tenant-context';
import { getTenantContext } from './tenant-context.service';

export const DATABASE_POOL = Symbol('DATABASE_POOL');
export const DATABASE = Symbol('DATABASE');

class TenantAwarePool extends Pool {
  private async applyTenantContext(client: PoolClient): Promise<void> {
    const context = getTenantContext();

    if (!context) {
      return;
    }

    await setTenantContextOnPgClient(client, context);
  }

  override connect(): Promise<PoolClient>;
  override connect(
    callback: (err: Error | undefined, client: PoolClient, release: (err?: Error) => void) => void,
  ): void;
  override connect(
    callback?: (err: Error | undefined, client: PoolClient, release: (err?: Error) => void) => void,
  ): Promise<PoolClient> | void {
    if (callback) {
      super.connect((err, client, release) => {
        if (err || !client) {
          callback(err, client!, release);
          return;
        }

        void this.applyTenantContext(client)
          .then(() => callback(undefined, client, release))
          .catch((error: Error) => {
            release(error);
            callback(error, client, release);
          });
      });
      return;
    }

    return super.connect().then(async (client) => {
      await this.applyTenantContext(client);
      return client;
    });
  }
}

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_POOL,
    inject: [EnvironmentService],
    useFactory: (environmentService: EnvironmentService) =>
      new TenantAwarePool({
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
