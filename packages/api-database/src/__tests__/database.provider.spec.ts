import type { PoolClient } from "pg";

import { describe, expect, it, vi } from "vitest";

import {
  createTenantAwareConnect,
  createTenantAwareQuery,
  withTenantContextClient,
} from "../database.provider";

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
