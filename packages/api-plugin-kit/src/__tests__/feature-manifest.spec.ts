import { describe, expect, it } from "vitest";

import {
  collectFeatureModules,
  collectFeatureSeeders,
  composeFeaturePermissions,
  composeFeatureSchemas,
  composeFeatures,
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
