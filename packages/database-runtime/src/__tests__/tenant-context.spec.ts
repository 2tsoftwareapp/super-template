import { describe, expect, it, vi } from "vitest";

import { tenantContextForJob, WORKER_DISPATCH_CONTEXT } from "@repo/api-kernel";
import type { DatabaseExecutor } from "../database.types";

import {
  resolveTenantSchemaName,
  resolveTenantSearchPath,
  setTenantContextOnExecutor,
  setTenantContextOnPgClient,
} from "../tenant-context";

const schemaRuntimeOptions = {
  tenantMode: "schema-per-tenant" as const,
  readReplica: false,
  readConsistency: "strong" as const,
};

describe("schema-per-tenant naming", () => {
  it("maps a UUID to a safe tenant schema and keeps public as the fallback", () => {
    expect(resolveTenantSchemaName("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "tenant_550e8400_e29b_41d4_a716_446655440000",
    );
    expect(resolveTenantSearchPath("", "schema-per-tenant")).toBe("public");
  });

  it("rejects non-UUID tenant identifiers before building search_path", () => {
    expect(() => resolveTenantSchemaName("org-1")).toThrow(/expected a UUID/);
    expect(() => resolveTenantSearchPath("org-1", "schema-per-tenant")).toThrow(/expected a UUID/);
  });
});

describe("tenantContextForJob", () => {
  it("maps a job with an organization and actor", () => {
    expect(tenantContextForJob({ organizationId: "org-1", actorUserId: "user-1" })).toEqual({
      tenantId: "org-1",
      userId: "user-1",
      bypassRls: false,
    });
  });

  it("falls back to empty strings when the job has no tenant or actor", () => {
    expect(tenantContextForJob({ organizationId: null, actorUserId: null })).toEqual({
      tenantId: "",
      userId: "",
      bypassRls: false,
    });
  });
});

describe("WORKER_DISPATCH_CONTEXT", () => {
  it("bypasses RLS for cross-tenant worker dispatch", () => {
    expect(WORKER_DISPATCH_CONTEXT).toEqual({
      tenantId: "",
      userId: "",
      bypassRls: true,
    });
  });
});

describe("setTenantContextOnExecutor", () => {
  it("issues a single set_config round trip for tenant id, user id, and bypass flag", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const executor = { execute } as unknown as DatabaseExecutor;

    await setTenantContextOnExecutor(executor, {
      tenantId: "org-1",
      userId: "user-1",
      bypassRls: true,
    });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("adds a tenant search_path only for schema-per-tenant mode", async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const executor = { execute } as unknown as DatabaseExecutor;

    await setTenantContextOnExecutor(
      executor,
      {
        tenantId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user-1",
      },
      schemaRuntimeOptions,
    );

    expect(execute).toHaveBeenCalledTimes(1);
  });
});

describe("setTenantContextOnPgClient", () => {
  it("sets all three GUCs in a single parameterized query", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const client = { query } as never;

    await setTenantContextOnPgClient(client, {
      tenantId: "org-1",
      userId: "user-1",
      bypassRls: false,
    });

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("set_config('app.tenant_id', $1, false)"),
      ["org-1", "user-1", "false"],
    );
  });

  it("defaults to empty/false when no context is provided", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const client = { query } as never;

    await setTenantContextOnPgClient(client);

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("set_config('app.tenant_id', $1, false)"),
      ["", "", "false"],
    );
  });

  it("sets a public-plus-tenant search_path in schema-per-tenant mode", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const client = { query } as never;

    await setTenantContextOnPgClient(
      client,
      { tenantId: "550e8400-e29b-41d4-a716-446655440000", userId: "user-1" },
      schemaRuntimeOptions,
    );

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("set_config('search_path', $4, false)"),
      [
        "550e8400-e29b-41d4-a716-446655440000",
        "user-1",
        "false",
        "tenant_550e8400_e29b_41d4_a716_446655440000, public",
      ],
    );
  });

  it("rejects an invalid tenant before sending any SQL", async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const client = { query } as never;

    await expect(
      setTenantContextOnPgClient(
        client,
        { tenantId: "org-1", userId: "user-1" },
        schemaRuntimeOptions,
      ),
    ).rejects.toThrow(/expected a UUID/);
    expect(query).not.toHaveBeenCalled();
  });
});
