import type { Provider } from "@nestjs/common";

import {
  DATABASE_RUNTIME_ENV,
  type DatabaseRuntimeEnv,
  type DatabaseRuntimeOptions,
  getTenantContext,
} from "@repo/api-kernel";
import { Pool, type PoolClient, type PoolConfig } from "pg";

import { createDatabaseClient, createReadReplicaDatabaseClient } from "./database.types";
import { schema as defaultSchema } from "./schema";
import { setTenantContextOnPgClient } from "./tenant-context";

export const DATABASE_POOL = Symbol("DATABASE_POOL");
/** Nest token for the optional tenant-aware read-replica pool. */
export const DATABASE_READ_REPLICA_POOL = Symbol("DATABASE_READ_REPLICA_POOL");
export const ADVISORY_LOCK_POOL = Symbol("ADVISORY_LOCK_POOL");
export const DATABASE = Symbol("DATABASE");
/** Nest token for security-sensitive reads and writes pinned to the primary. */
export const DATABASE_PRIMARY = Symbol("DATABASE_PRIMARY");
/** Nest token for the composed tenant and database-topology options. */
export const DATABASE_RUNTIME_OPTIONS = Symbol("DATABASE_RUNTIME_OPTIONS");

/** Compatibility defaults for registries that do not select infrastructure capabilities. */
export const DEFAULT_DATABASE_RUNTIME_OPTIONS: DatabaseRuntimeOptions = {
  tenantMode: "shared-schema",
  readReplica: false,
  readConsistency: "strong",
};

/**
 * Token holding the composed Drizzle schema. The application overrides this via
 * {@link DatabaseModule.forRoot} to merge every enabled feature's tables; when
 * left unset it falls back to the empty runtime default.
 */
export const DATABASE_SCHEMA = Symbol("DATABASE_SCHEMA");

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

const resolvePrimaryConnectionString = (databaseEnv: DatabaseRuntimeEnv): string => {
  const connectionString = databaseEnv.isTest
    ? databaseEnv.databaseUrlTest
    : databaseEnv.databaseUrl;
  if (!connectionString) {
    throw new Error("DATABASE_URL_TEST is required when APP_ENV=test but was not provided");
  }
  return connectionString;
};

const resolveReplicaConnectionString = (databaseEnv: DatabaseRuntimeEnv): string => {
  const connectionString = databaseEnv.isTest
    ? databaseEnv.databaseUrlTestReadReplica
    : databaseEnv.databaseUrlReadReplica;
  const variable = databaseEnv.isTest
    ? "DATABASE_URL_TEST_READ_REPLICA"
    : "DATABASE_URL_READ_REPLICA";
  if (!connectionString) {
    throw new Error(
      `${variable} is required when database-read-replica capability is enabled but was not provided`,
    );
  }
  return connectionString;
};

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
      try {
        await applyTenantContext(client);
        return client;
      } catch (error) {
        // Mirror the callback branch: a failed context application must not
        // leak the checked-out client back into the pool.
        client.release(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
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

export const createTenantAwarePool = (
  config: PoolConfig,
  options: DatabaseRuntimeOptions = DEFAULT_DATABASE_RUNTIME_OPTIONS,
): Pool => {
  // Every pool checkout must re-apply tenant GUCs; bypassing this pool with a raw
  // DATABASE_POOL client would leak or drop tenant context across requests.
  const pool = new Pool(config);
  const originalConnect = pool.connect.bind(pool);

  const applyTenantContext = async (client: PoolClient): Promise<void> => {
    await setTenantContextOnPgClient(client, getTenantContext(), options);
  };

  pool.connect = createTenantAwareConnect(originalConnect, applyTenantContext);
  pool.query = createTenantAwareQuery(originalConnect, applyTenantContext);

  return pool;
};

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_RUNTIME_OPTIONS,
    useValue: DEFAULT_DATABASE_RUNTIME_OPTIONS,
  },
  {
    provide: DATABASE_POOL,
    inject: [DATABASE_RUNTIME_ENV, DATABASE_RUNTIME_OPTIONS],
    useFactory: (databaseEnv: DatabaseRuntimeEnv, databaseOptions: DatabaseRuntimeOptions) => {
      return createTenantAwarePool(
        { connectionString: resolvePrimaryConnectionString(databaseEnv) },
        databaseOptions,
      );
    },
  },
  {
    provide: DATABASE_READ_REPLICA_POOL,
    inject: [DATABASE_RUNTIME_ENV, DATABASE_RUNTIME_OPTIONS],
    useFactory: (
      databaseEnv: DatabaseRuntimeEnv,
      databaseOptions: DatabaseRuntimeOptions,
    ): Pool | undefined => {
      if (!databaseOptions.readReplica) return undefined;
      return createTenantAwarePool(
        { connectionString: resolveReplicaConnectionString(databaseEnv) },
        databaseOptions,
      );
    },
  },
  {
    provide: DATABASE_SCHEMA,
    useValue: defaultSchema,
  },
  {
    provide: DATABASE_PRIMARY,
    inject: [DATABASE_POOL, DATABASE_SCHEMA],
    useFactory: (pool: Pool, schema: Record<string, unknown>) => createDatabaseClient(pool, schema),
  },
  {
    provide: DATABASE,
    inject: [DATABASE_POOL, DATABASE_SCHEMA, DATABASE_RUNTIME_OPTIONS, DATABASE_READ_REPLICA_POOL],
    useFactory: (
      pool: Pool,
      schema: Record<string, unknown>,
      databaseOptions: DatabaseRuntimeOptions,
      replicaPool?: Pool,
    ) =>
      databaseOptions.readReplica && replicaPool
        ? createReadReplicaDatabaseClient(pool, replicaPool, schema, databaseOptions)
        : createDatabaseClient(pool, schema),
  },
  {
    provide: ADVISORY_LOCK_POOL,
    inject: [DATABASE_RUNTIME_ENV],
    useFactory: (databaseEnv: DatabaseRuntimeEnv) => {
      const connectionString = resolvePrimaryConnectionString(databaseEnv);

      // Dedicated pool for session-level advisory locks.  A small max prevents
      // pool starvation when the main pool connections are held by lock-holder
      // callbacks that also need to query the database.
      return new Pool({ connectionString, max: 10 });
    },
  },
];
