import type { Provider } from "@nestjs/common";

import { EnvironmentService, getTenantContext } from "@repo/api-core";
import { Pool, type PoolClient, type PoolConfig } from "pg";

import { createDatabaseClient } from "./database.types";
import { setTenantContextOnPgClient } from "./tenant-context";

export const DATABASE_POOL = Symbol("DATABASE_POOL");
export const ADVISORY_LOCK_POOL = Symbol("ADVISORY_LOCK_POOL");
export const DATABASE = Symbol("DATABASE");

type PoolRelease = (err?: Error) => void;
type PoolConnectCallback = (
  err: Error | undefined,
  client: PoolClient | undefined,
  release: PoolRelease,
) => void;
type PoolQueryCallback<TResult = unknown> = (
  err: Error | undefined,
  result: TResult | undefined,
) => void;

function invokeConnectCallback(
  callback: PoolConnectCallback,
  err: Error | undefined,
  client: PoolClient | undefined,
  release: PoolRelease,
): void {
  callback(err, client, release);
}

async function executeClientQuery<TResult>(
  client: PoolClient,
  args: readonly unknown[],
): Promise<TResult> {
  return (client.query as (...input: readonly unknown[]) => Promise<TResult>)(...args);
}

export async function withTenantContextClient<T>(
  checkoutClient: () => Promise<PoolClient>,
  applyTenantContext: (client: PoolClient) => Promise<void>,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await checkoutClient();

  try {
    await applyTenantContext(client);
    return await operation(client);
  } finally {
    client.release();
  }
}

export function createTenantAwareConnect(
  originalConnect: Pool["connect"],
  applyTenantContext: (client: PoolClient) => Promise<void>,
): Pool["connect"] {
  return ((callback?: PoolConnectCallback) => {
    if (typeof callback === "function") {
      originalConnect((err, client, release) => {
        if (err || !client) {
          invokeConnectCallback(callback, err, client, release);
          return;
        }

        void applyTenantContext(client)
          .then(() => invokeConnectCallback(callback, undefined, client, release))
          .catch((error: Error) => {
            release(error);
            invokeConnectCallback(callback, error, client, release);
          });
      });
      return;
    }

    return originalConnect().then(async (client) => {
      await applyTenantContext(client);
      return client;
    });
  }) as typeof originalConnect;
}

export function createTenantAwareQuery(
  checkoutClient: () => Promise<PoolClient>,
  applyTenantContext: (client: PoolClient) => Promise<void>,
): Pool["query"] {
  return ((...args: unknown[]) => {
    const maybeCallback = args.at(-1);

    if (typeof maybeCallback === "function") {
      const callback = maybeCallback as PoolQueryCallback;
      const queryArgs = args.slice(0, -1);

      void withTenantContextClient(checkoutClient, applyTenantContext, (client) =>
        executeClientQuery(client, queryArgs),
      )
        .then((result) => callback(undefined, result))
        .catch((error: Error) => callback(error, undefined));
      return;
    }

    return withTenantContextClient(checkoutClient, applyTenantContext, (client) =>
      executeClientQuery(client, args),
    );
  }) as Pool["query"];
}

export const createTenantAwarePool = (config: PoolConfig): Pool => {
  // Every pool checkout must re-apply tenant GUCs; bypassing this pool with a raw
  // DATABASE_POOL client would leak or drop tenant context across requests.
  const pool = new Pool(config);
  const originalConnect = pool.connect.bind(pool);

  const applyTenantContext = async (client: PoolClient): Promise<void> => {
    await setTenantContextOnPgClient(client, getTenantContext());
  };

  pool.connect = createTenantAwareConnect(originalConnect, applyTenantContext);
  pool.query = createTenantAwareQuery(originalConnect, applyTenantContext);

  return pool;
};

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_POOL,
    inject: [EnvironmentService],
    useFactory: (environmentService: EnvironmentService) => {
      const connectionString = environmentService.isTest
        ? environmentService.databaseUrlTest
        : environmentService.databaseUrl;

      if (!connectionString) {
        throw new Error("DATABASE_URL_TEST is required when APP_ENV=test but was not provided");
      }

      return createTenantAwarePool({ connectionString });
    },
  },
  {
    provide: DATABASE,
    inject: [DATABASE_POOL],
    useFactory: createDatabaseClient,
  },
  {
    provide: ADVISORY_LOCK_POOL,
    inject: [EnvironmentService],
    useFactory: (environmentService: EnvironmentService) => {
      const connectionString = environmentService.isTest
        ? environmentService.databaseUrlTest
        : environmentService.databaseUrl;

      if (!connectionString) {
        throw new Error("DATABASE_URL_TEST is required when APP_ENV=test but was not provided");
      }

      // Dedicated pool for session-level advisory locks.  A small max prevents
      // pool starvation when the main pool connections are held by lock-holder
      // callbacks that also need to query the database.
      return new Pool({ connectionString, max: 10 });
    },
  },
];
