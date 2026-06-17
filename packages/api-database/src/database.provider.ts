import type { Provider } from '@nestjs/common';

import { EnvironmentService } from '@repo/api-core';
import { Pool, type PoolClient, type PoolConfig } from 'pg';

import { createDatabaseClient } from './database.types';
import { setTenantContextOnPgClient } from './tenant-context';
import { getTenantContext } from './tenant-context.service';

export const DATABASE_POOL = Symbol('DATABASE_POOL');
export const DATABASE = Symbol('DATABASE');

const createTenantAwarePool = (config: PoolConfig): Pool => {
  const pool = new Pool(config);
  const originalConnect = pool.connect.bind(pool);

  const applyTenantContext = async (client: PoolClient): Promise<void> => {
    await setTenantContextOnPgClient(client, getTenantContext());
  };

  const withTenantContextClient = async <T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> => {
    const client = await originalConnect();

    try {
      await applyTenantContext(client);
      return await operation(client);
    } finally {
      client.release();
    }
  };

  pool.connect = ((callback?: unknown) => {
    if (typeof callback === 'function') {
      originalConnect((err, client, release) => {
        if (err || !client) {
          (
            callback as (
              err: Error | undefined,
              client: PoolClient,
              release: (err?: Error) => void,
            ) => void
          )(err, client!, release);
          return;
        }

        void applyTenantContext(client)
          .then(() =>
            (
              callback as (
                err: Error | undefined,
                client: PoolClient,
                release: (err?: Error) => void,
              ) => void
            )(undefined, client, release),
          )
          .catch((error: Error) => {
            release(error);
            (
              callback as (
                err: Error | undefined,
                client: PoolClient,
                release: (err?: Error) => void,
              ) => void
            )(error, client, release);
          });
      });
      return;
    }

    return originalConnect().then(async (client) => {
      await applyTenantContext(client);
      return client;
    });
  }) as typeof pool.connect;

  pool.query = ((...args: unknown[]) => {
    const maybeCallback = args.at(-1);

    if (typeof maybeCallback === 'function') {
      const callback = maybeCallback as (
        err: Error | undefined,
        result: unknown,
      ) => void;
      const queryArgs = args.slice(0, -1) as Parameters<PoolClient['query']>;

      void withTenantContextClient(
        (client) =>
          (client.query as (...input: unknown[]) => Promise<unknown>)(
            ...queryArgs,
          ),
      )
        .then((result) => callback(undefined, result))
        .catch((error: Error) => callback(error, undefined));
      return;
    }

    return withTenantContextClient((client) =>
      (client.query as (...input: unknown[]) => Promise<unknown>)(
        ...(args as Parameters<PoolClient['query']>),
      ),
    );
  }) as typeof pool.query;

  return pool;
};

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_POOL,
    inject: [EnvironmentService],
    useFactory: (environmentService: EnvironmentService) =>
      createTenantAwarePool({
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
