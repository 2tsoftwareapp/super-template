import { describe, expect, it } from "vitest";

import {
  collectFeatureModules,
  composeFeatureSchemas,
  defineFeature,
  type FeatureManifest,
} from "../feature-manifest";

class ModuleA {}
class ModuleB {}

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
    expect(
      collectFeatureModules([{ nestModule: ModuleA }, { nestModule: ModuleB }]),
    ).toEqual([ModuleA, ModuleB]);
  });
});
