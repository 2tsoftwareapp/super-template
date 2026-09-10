import { Pool, type PoolClient } from "pg";

import { describe, expect, it, vi } from "vitest";

import {
  DATABASE,
  DATABASE_READ_REPLICA_POOL,
  DEFAULT_DATABASE_RUNTIME_OPTIONS,
  databaseProviders,
  createTenantAwareConnect,
  createTenantAwareQuery,
  withTenantContextClient,
} from "../database.provider";
import { DatabaseModule } from "../database.module";
import { createReadReplicaDatabaseClient } from "../database.types";

function createClient() {
  return {
    query: vi.fn(),
    release: vi.fn(),
  } as unknown as PoolClient;
}

describe("database.provider helpers", () => {
  it("releases clients after tenant-aware operations", async () => {
    const client = createClient();
    const applyTenantContext = vi.fn().mockResolvedValue(undefined);
    const operation = vi.fn().mockResolvedValue("done");

    await expect(
      withTenantContextClient(async () => client, applyTenantContext, operation),
    ).resolves.toBe("done");

    expect(applyTenantContext).toHaveBeenCalledWith(client);
    expect(operation).toHaveBeenCalledWith(client);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("applies tenant context before returning promise-based connections", async () => {
    const client = createClient();
    const applyTenantContext = vi.fn().mockResolvedValue(undefined);
    const originalConnect = vi.fn().mockResolvedValue(client);
    const connect = createTenantAwareConnect(originalConnect as never, applyTenantContext);

    await expect(connect()).resolves.toBe(client);
    expect(applyTenantContext).toHaveBeenCalledWith(client);
  });

  it("releases the client when promise-based tenant context application fails", async () => {
    const client = createClient();
    const error = new Error("tenant context failed");
    const applyTenantContext = vi.fn().mockRejectedValue(error);
    const originalConnect = vi.fn().mockResolvedValue(client);
    const connect = createTenantAwareConnect(originalConnect as never, applyTenantContext);

    await expect(connect()).rejects.toBe(error);
    expect(client.release).toHaveBeenCalledWith(error);
  });

  it("reports callback-based connect failures from tenant context application", async () => {
    const client = createClient();
    const release = vi.fn();
    const callback = vi.fn();
    const error = new Error("tenant context failed");
    const applyTenantContext = vi.fn().mockRejectedValue(error);
    const originalConnect = vi.fn((handler: (...args: unknown[]) => void) =>
      handler(undefined, client, release),
    );
    const connect = createTenantAwareConnect(originalConnect as never, applyTenantContext);

    connect(callback as never);
    await vi.waitFor(() => expect(callback).toHaveBeenCalled());

    expect(release).toHaveBeenCalledWith(error);
    expect(callback).toHaveBeenCalledWith(error, client, release);
  });

  it("runs callback-based queries through a tenant-aware client checkout", async () => {
    const client = createClient();
    const queryResult = { rows: [{ id: 1 }] };
    const callback = vi.fn();

    (client.query as ReturnType<typeof vi.fn>).mockResolvedValue(queryResult);

    const query = createTenantAwareQuery(async () => client, vi.fn().mockResolvedValue(undefined));

    query("select 1", callback as never);
    await vi.waitFor(() => expect(callback).toHaveBeenCalled());

    expect(client.query).toHaveBeenCalledWith("select 1");
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(undefined, queryResult);
  });

  it("runs promise-based queries through a tenant-aware client checkout", async () => {
    const client = createClient();
    const queryResult = { rows: [{ id: 2 }] };

    (client.query as ReturnType<typeof vi.fn>).mockResolvedValue(queryResult);

    const query = createTenantAwareQuery(async () => client, vi.fn().mockResolvedValue(undefined));

    await expect(query("select 2")).resolves.toEqual(queryResult);
    expect(client.query).toHaveBeenCalledWith("select 2");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});

describe("database replica providers", () => {
  const testEnvironment = {
    isTest: true,
    databaseUrl: "postgres://primary/app",
    databaseUrlTest: "postgres://primary/app_test",
    databaseSkipRlsCheck: false,
  };
  const replicaOptions = {
    tenantMode: "shared-schema" as const,
    readReplica: true,
    readConsistency: "eventual" as const,
  };

  type FactoryProvider = {
    provide: symbol;
    useFactory: (...args: unknown[]) => unknown;
  };

  function factoryProvider(token: symbol): FactoryProvider {
    const provider = databaseProviders.find((entry) => {
      if (typeof entry !== "object" || entry === null) return false;
      const candidate = entry as { provide?: unknown; useFactory?: unknown };
      return candidate.provide === token && typeof candidate.useFactory === "function";
    }) as FactoryProvider | undefined;
    if (!provider) {
      throw new Error(`Missing provider factory for ${String(token)}`);
    }
    return provider;
  }

  it("fails closed when the selected replica has no test URL", () => {
    const factory = factoryProvider(DATABASE_READ_REPLICA_POOL).useFactory;

    expect(() => factory(testEnvironment, replicaOptions)).toThrow(
      /DATABASE_URL_TEST_READ_REPLICA is required/,
    );
  });

  it("does not create a replica pool for the primary-only default", () => {
    const factory = factoryProvider(DATABASE_READ_REPLICA_POOL).useFactory;

    expect(factory(testEnvironment, DEFAULT_DATABASE_RUNTIME_OPTIONS)).toBeUndefined();
  });

  it("routes select helpers to the replica and raw execution to primary", async () => {
    const primaryPool = new Pool({ connectionString: "postgres://primary/app" });
    const replicaPool = new Pool({ connectionString: "postgres://replica/app" });
    const database = createReadReplicaDatabaseClient(primaryPool, replicaPool, {});

    const replicaSelect = vi.spyOn(database.$replicas[0]!, "select");
    const primaryExecute = vi.spyOn(database.$primary, "execute");

    database.select();
    database.execute("select 1");

    expect(replicaSelect).toHaveBeenCalledTimes(1);
    expect(primaryExecute).toHaveBeenCalledTimes(1);
    expect(database.$primary.$client).toBe(primaryPool);
    expect(database.$replicas[0]!.$client).toBe(replicaPool);
    await Promise.all([primaryPool.end(), replicaPool.end()]);
  });

  it("routes mutation builders and transactions to primary", async () => {
    const primaryPool = new Pool({ connectionString: "postgres://primary/app" });
    const replicaPool = new Pool({ connectionString: "postgres://replica/app" });
    const database = createReadReplicaDatabaseClient(primaryPool, replicaPool, {});

    const primaryInsert = vi.spyOn(database.$primary, "insert");
    const primaryUpdate = vi.spyOn(database.$primary, "update");
    const primaryDelete = vi.spyOn(database.$primary, "delete");
    const primaryTransaction = vi
      .spyOn(database.$primary, "transaction")
      .mockResolvedValue(undefined as never);

    database.insert({} as never);
    database.update({} as never);
    database.delete({} as never);
    await database.transaction(async () => undefined);

    expect(primaryInsert).toHaveBeenCalledTimes(1);
    expect(primaryUpdate).toHaveBeenCalledTimes(1);
    expect(primaryDelete).toHaveBeenCalledTimes(1);
    expect(primaryTransaction).toHaveBeenCalledTimes(1);
    await Promise.all([primaryPool.end(), replicaPool.end()]);
  });

  it("uses the primary database client when replica injection is absent", async () => {
    const provider = factoryProvider(DATABASE);

    const primaryPool = new Pool({ connectionString: "postgres://primary/app" });
    const database = provider.useFactory(
      primaryPool,
      {},
      DEFAULT_DATABASE_RUNTIME_OPTIONS,
      undefined,
    ) as import("../database.types").DatabaseClient;

    expect(
      (database as import("../database.types").ReadReplicaDatabaseClient).$primary,
    ).toBeUndefined();
    expect(database.$client).toBe(primaryPool);
    await primaryPool.end();
  });

  it("closes the optional replica together with primary and advisory pools", async () => {
    const primaryEnd = vi.fn().mockResolvedValue(undefined);
    const replicaEnd = vi.fn().mockResolvedValue(undefined);
    const advisoryLockEnd = vi.fn().mockResolvedValue(undefined);
    const primaryPool = { end: primaryEnd } as never;
    const replicaPool = { end: replicaEnd } as never;
    const advisoryLockPool = { end: advisoryLockEnd } as never;

    await new DatabaseModule(primaryPool, replicaPool, advisoryLockPool).onApplicationShutdown();

    expect(primaryEnd).toHaveBeenCalledTimes(1);
    expect(replicaEnd).toHaveBeenCalledTimes(1);
    expect(advisoryLockEnd).toHaveBeenCalledTimes(1);
  });
});
