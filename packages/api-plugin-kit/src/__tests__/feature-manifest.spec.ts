import { describe, expect, it } from "vitest";

import {
  collectFeatureModules,
  collectFeatureSeeders,
  composeDatabaseRuntimeOptions,
  composeFeaturePermissions,
  composeFeatureSchemas,
  composeFeatures,
  computeRemovalClosure,
  defineFeature,
  orderFeatureManifests,
  type FeatureManifest,
} from "../feature-manifest";

class ModuleA {}
class ModuleB {}
class ModuleC {}

const tableUsers = { __table: "m_users" };
const tableAudit = { __table: "l_audit_logs" };

describe("defineFeature", () => {
  it("returns the manifest unchanged", () => {
    const manifest: FeatureManifest = { id: "a", nestModule: ModuleA };
    expect(defineFeature(manifest)).toBe(manifest);
  });
});

describe("composeDatabaseRuntimeOptions", () => {
  it("defaults to shared-schema and primary-only", () => {
    expect(composeDatabaseRuntimeOptions([{ id: "health" }])).toEqual({
      tenantMode: "shared-schema",
      readReplica: false,
      readConsistency: "strong",
    });
  });

  it("rejects mutually exclusive tenant modes", () => {
    expect(() =>
      composeDatabaseRuntimeOptions([
        { id: "tenant-shared-schema", database: { tenantMode: "shared-schema" } },
        { id: "tenant-schema", database: { tenantMode: "schema-per-tenant" } },
      ]),
    ).toThrow(/tenant-shared-schema.*tenant-schema/);
  });

  it("composes the independent replica capability", () => {
    expect(
      composeDatabaseRuntimeOptions([
        { id: "tenant-schema", database: { tenantMode: "schema-per-tenant" } },
        { id: "database-read-replica", database: { readReplica: true } },
      ]),
    ).toEqual({
      tenantMode: "schema-per-tenant",
      readReplica: true,
      readConsistency: "eventual",
    });
  });

  it("rejects a strong policy combined with replica routing", () => {
    expect(() =>
      composeDatabaseRuntimeOptions([
        { id: "database-read-replica", database: { readReplica: true, readConsistency: "strong" } },
      ]),
    ).toThrow(/Strong read consistency is incompatible with readReplica=true/);
  });

  it("preserves the eventual policy as part of the composed selector", () => {
    expect(
      composeDatabaseRuntimeOptions([
        {
          id: "database-read-replica",
          database: { readReplica: true, readConsistency: "eventual" },
        },
      ]),
    ).toMatchObject({ readReplica: true, readConsistency: "eventual" });
  });
});

describe("composeFeatureSchemas", () => {
  it("merges schema contributions across features", () => {
    const composed = composeFeatureSchemas([
      { id: "identity", schema: { users: tableUsers } },
      { id: "audit", schema: { auditLogs: tableAudit } },
    ]);

    expect(composed).toEqual({ users: tableUsers, auditLogs: tableAudit });
  });

  it("ignores features that contribute no schema", () => {
    const composed = composeFeatureSchemas([
      { id: "health" },
      { id: "identity", schema: { users: tableUsers } },
    ]);

    expect(composed).toEqual({ users: tableUsers });
  });

  it("throws on duplicate table names so two features cannot claim the same table", () => {
    expect(() =>
      composeFeatureSchemas([
        { id: "identity", schema: { users: tableUsers } },
        { id: "rogue", schema: { users: tableUsers } },
      ]),
    ).toThrow(/Duplicate schema table "users".*"rogue"/);
  });
});

describe("collectFeatureModules", () => {
  it("preserves feature order", () => {
    expect(collectFeatureModules([{ nestModule: ModuleA }, { nestModule: ModuleB }])).toEqual([
      ModuleA,
      ModuleB,
    ]);
  });
});

describe("composeFeaturePermissions", () => {
  it("deduplicates while preserving first-seen order", () => {
    expect(
      composeFeaturePermissions([
        { permissions: ["users:read", "users:write"] },
        { permissions: ["users:write", "audit:read"] },
      ]),
    ).toEqual(["users:read", "users:write", "audit:read"]);
  });
});

describe("collectFeatureSeeders", () => {
  it("collects seeders in composition order", () => {
    const seedA = { id: "a", run: () => undefined };
    const seedB = { id: "b", run: () => undefined };

    expect(collectFeatureSeeders([{ seeders: [seedA] }, {}, { seeders: [seedB] }])).toEqual([
      seedA,
      seedB,
    ]);
  });

  it("runs a seeder after its declared dependency even when composed first", () => {
    const bagWriter = { id: "users", run: () => undefined };
    const bagReader = { id: "notifications", dependsOn: ["users"], run: () => undefined };

    expect(
      collectFeatureSeeders([{ seeders: [bagReader] }, {}, { seeders: [bagWriter] }]).map(
        (seeder) => seeder.id,
      ),
    ).toEqual(["users", "notifications"]);
  });

  it("keeps composition order as the tie-break for independent seeders", () => {
    const seedA = { id: "a", run: () => undefined };
    const seedB = { id: "b", run: () => undefined };
    const seedC = { id: "c", dependsOn: ["a"], run: () => undefined };

    expect(
      collectFeatureSeeders([{ seeders: [seedC, seedB] }, { seeders: [seedA] }]).map((s) => s.id),
    ).toEqual(["a", "c", "b"]);
  });

  it("orders transitively across features", () => {
    const roles = { id: "access-control", run: () => undefined };
    const users = { id: "users", dependsOn: ["access-control"], run: () => undefined };
    const auth = { id: "auth-session-cleanup", dependsOn: ["users"], run: () => undefined };

    expect(
      collectFeatureSeeders([{ seeders: [auth] }, { seeders: [users] }, { seeders: [roles] }]).map(
        (s) => s.id,
      ),
    ).toEqual(["access-control", "users", "auth-session-cleanup"]);
  });

  it("rejects a dependency on an unknown seeder id", () => {
    expect(() =>
      collectFeatureSeeders([
        { seeders: [{ id: "auth-session-cleanup", dependsOn: ["missing"], run: () => undefined }] },
      ]),
    ).toThrow(/Seeder "auth-session-cleanup" depends on missing seeder "missing"/);
  });

  it("detects seeder dependency cycles", () => {
    expect(() =>
      collectFeatureSeeders([
        {
          seeders: [
            { id: "a", dependsOn: ["b"], run: () => undefined },
            { id: "b", dependsOn: ["a"], run: () => undefined },
          ],
        },
      ]),
    ).toThrow(/Seeder dependency cycle detected: a -> b -> a/);
  });

  it("rejects duplicate seeder ids across features", () => {
    expect(() =>
      collectFeatureSeeders([
        { seeders: [{ id: "users", run: () => undefined }] },
        { seeders: [{ id: "users", run: () => undefined }] },
      ]),
    ).toThrow(/Duplicate seeder id "users"/);
  });
});

describe("computeRemovalClosure", () => {
  const seed = (id: string, dependsOn?: readonly string[]) => ({
    id,
    ...(dependsOn ? { dependsOn } : {}),
    run: () => undefined,
  });
  const fixtures: FeatureManifest[] = [
    { id: "access-control", nestModule: ModuleA, seeders: [seed("access-control")] },
    {
      id: "user-management",
      nestModule: ModuleB,
      dependsOn: ["access-control"],
      seeders: [seed("users", ["access-control"])],
    },
    { id: "auth", nestModule: ModuleC, seeders: [seed("auth-session-cleanup", ["users"])] },
    { id: "health", nestModule: ModuleA },
  ];

  it("removes features depending transitively on an omitted feature", () => {
    expect(computeRemovalClosure(fixtures, ["access-control"])).toEqual([
      "access-control",
      "auth",
      "user-management",
    ]);
  });

  it("closes over seeder dependencies of an omitted feature", () => {
    expect(computeRemovalClosure(fixtures, ["user-management"])).toEqual([
      "auth",
      "user-management",
    ]);
  });

  it("keeps a feature whose seeder dependency no feature ever declares", () => {
    const orphan: FeatureManifest = {
      id: "rogue",
      nestModule: ModuleA,
      seeders: [seed("rogue", ["typo"])],
    };

    expect(computeRemovalClosure([...fixtures, orphan], ["health"])).toEqual(["health"]);
  });
});

describe("orderFeatureManifests / composeFeatures", () => {
  it("rejects duplicate feature ids", () => {
    expect(() =>
      orderFeatureManifests([
        { id: "a", nestModule: ModuleA },
        { id: "a", nestModule: ModuleB },
      ]),
    ).toThrow(/Duplicate feature id "a"/);
  });

  it("rejects missing dependencies", () => {
    expect(() =>
      orderFeatureManifests([{ id: "a", nestModule: ModuleA, dependsOn: ["missing"] }]),
    ).toThrow(/depends on missing feature "missing"/);
  });

  it("detects dependency cycles", () => {
    expect(() =>
      orderFeatureManifests([
        { id: "a", nestModule: ModuleA, dependsOn: ["b"] },
        { id: "b", nestModule: ModuleB, dependsOn: ["a"] },
      ]),
    ).toThrow(/Feature dependency cycle detected/);
  });

  it("returns deterministic topological order preserving input tie-breaks", () => {
    const ordered = orderFeatureManifests([
      { id: "c", nestModule: ModuleC, dependsOn: ["a"] },
      { id: "b", nestModule: ModuleB },
      { id: "a", nestModule: ModuleA },
    ]);

    expect(ordered.map((f) => f.id)).toEqual(["a", "c", "b"]);
  });

  it("composeFeatures merges all contributions in dependency order", () => {
    const seeder = { id: "seed-users", run: () => undefined };
    const composed = composeFeatures([
      {
        id: "audit",
        nestModule: ModuleB,
        dependsOn: ["users"],
        schema: { auditLogs: tableAudit },
        permissions: ["audit:read"],
      },
      {
        id: "users",
        nestModule: ModuleA,
        schema: { users: tableUsers },
        permissions: ["users:read"],
        seeders: [seeder],
      },
    ]);

    expect(composed.features.map((f) => f.id)).toEqual(["users", "audit"]);
    expect(composed.modules).toEqual([ModuleA, ModuleB]);
    expect(composed.schema).toEqual({ users: tableUsers, auditLogs: tableAudit });
    expect(composed.permissions).toEqual(["users:read", "audit:read"]);
    expect(composed.seeders).toEqual([seeder]);
  });
});
