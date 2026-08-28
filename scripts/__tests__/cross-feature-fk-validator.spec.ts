import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildImportResolver,
  validateForeignKeys,
  type FkCheck,
} from "../lib/cross-feature-fk-validator.mjs";

const fixture = `import { organizations } from "@repo/feature-organizations/schema";
import { users } from "@repo/feature-users/schema";
import { pgTable, uuid } from "drizzle-orm/pg-core";

export const organizationMembers = pgTable("r_organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
});
`;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const check: FkCheck = {
  sourceFile: "fixture.ts",
  sourceTableExport: "organizationMembers",
  propertyName: "userId",
  physicalColumnName: "user_id",
  targetFile: `${repoRoot}/packages/feature-users/src/infrastructure/persistence/users.ts`,
  targetTableExport: "users",
  targetPropertyName: "id",
  nullable: false,
  onDelete: "cascade",
};

const buildResolver = () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  const map = new Map<string, string>([
    ["users", `${repoRoot}/packages/feature-users/src/infrastructure/persistence/users.ts`],
    [
      "organizations",
      `${repoRoot}/packages/feature-organizations/src/infrastructure/persistence/organizations.ts`,
    ],
  ]);
  return (name: string) => map.get(name);
};

describe("FK guard: pure validation", () => {
  it("accepts a canonical chain", () => {
    const failures = validateForeignKeys("fixture.ts", fixture, [check], buildResolver());
    expect(failures).toEqual([]);
  });

  it("rejects when .references() is removed", () => {
    const mutated = fixture.replace(
      '.notNull()\n    .references(() => users.id, { onDelete: "cascade" })',
      ".notNull()",
    );
    const failures = validateForeignKeys("fixture.ts", mutated, [check], buildResolver());
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.reason).toMatch(/missing \.references/);
  });

  it("rejects when .notNull() is removed from a required non-null FK", () => {
    const mutated = fixture
      .split("\n")
      .map((l) => (l.trim() === ".notNull()" ? "" : l))
      .filter((l) => l.length > 0)
      .join("\n");
    const failures = validateForeignKeys("fixture.ts", mutated, [check], buildResolver());
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.reason).toMatch(/expected nullable=false/);
  });

  it("rejects when the target changes to a different table", () => {
    const mutated = fixture.replace(
      '.references(() => users.id, { onDelete: "cascade" })',
      '.references(() => organizations.id, { onDelete: "cascade" })',
    );
    const failures = validateForeignKeys("fixture.ts", mutated, [check], buildResolver());
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.reason).toMatch(/target table expected "users"/);
  });

  it("rejects when onDelete action is altered", () => {
    const mutated = fixture.replace('{ onDelete: "cascade" }', '{ onDelete: "set null" }');
    const failures = validateForeignKeys("fixture.ts", mutated, [check], buildResolver());
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]?.reason).toMatch(/onDelete expected "cascade"/);
  });

  it("rejects when actorId FK is removed (notificationJobs)", () => {
    const nfFixture = `import { users } from "@repo/feature-users/schema";
import { pgTable, uuid } from "drizzle-orm/pg-core";

export const notificationJobs = pgTable("w_notification_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => users.id),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
});
`;
    const map = new Map<string, string>([
      ["users", `${repoRoot}/packages/feature-users/src/infrastructure/persistence/users.ts`],
    ]);
    const actorCheck: FkCheck = {
      sourceFile: "fixture.ts",
      sourceTableExport: "notificationJobs",
      propertyName: "actorId",
      physicalColumnName: "actor_id",
      targetFile: `${repoRoot}/packages/feature-users/src/infrastructure/persistence/users.ts`,
      targetTableExport: "users",
      targetPropertyName: "id",
      nullable: true,
      onDelete: "set null",
    };
    // Remove the entire actorId line (including the trailing comma on the next property).
    const idx = nfFixture.indexOf("actorId:");
    const withoutActor =
      nfFixture.slice(0, idx) +
      nfFixture.slice(nfFixture.indexOf("\n", idx) + 1).slice(nfFixture.indexOf("actorId:") + 8);
    // Simpler: just remove the actorId line text including newline.
    const withoutActorLine = nfFixture
      .split("\n")
      .filter((l) => !l.includes("actorId:"))
      .join("\n");
    const failures = validateForeignKeys("fixture.ts", withoutActorLine, [actorCheck], (n) =>
      map.get(n),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it("rejects when targetUserId FK is removed", () => {
    const nfFixture = `import { users } from "@repo/feature-users/schema";
import { pgTable, uuid } from "drizzle-orm/pg-core";

export const notificationJobs = pgTable("w_notification_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "set null" }),
});
`;
    const map = new Map<string, string>([
      ["users", `${repoRoot}/packages/feature-users/src/infrastructure/persistence/users.ts`],
    ]);
    const targetCheck: FkCheck = {
      sourceFile: "fixture.ts",
      sourceTableExport: "notificationJobs",
      propertyName: "targetUserId",
      physicalColumnName: "target_user_id",
      targetFile: `${repoRoot}/packages/feature-users/src/infrastructure/persistence/users.ts`,
      targetTableExport: "users",
      targetPropertyName: "id",
      nullable: true,
      onDelete: "set null",
    };
    const withoutTargetLine = nfFixture
      .split("\n")
      .filter((l) => !l.includes("targetUserId:"))
      .join("\n");
    const failures = validateForeignKeys("fixture.ts", withoutTargetLine, [targetCheck], (n) =>
      map.get(n),
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it("rejects when FK is attached to the wrong property", () => {
    const wrongProperty = fixture
      .replace(
        'userId: uuid("user_id")\n    .notNull()\n    .references(() => users.id, { onDelete: "cascade" }),',
        'userId: uuid("user_id"),',
      )
      .replace(
        'organizationId: uuid("organization_id")\n    .notNull()\n    .references(() => organizations.id, { onDelete: "cascade" }),',
        'organizationId: uuid("organization_id")\n    .notNull()\n    .references(() => users.id, { onDelete: "cascade" }),',
      );
    const failures = validateForeignKeys("fixture.ts", wrongProperty, [check], buildResolver());
    // The userId check should fail because no .references chain exists.
    expect(failures.length).toBeGreaterThan(0);
  });
});

describe("FK guard: import resolver follows re-exports", () => {
  it("resolves a workspace package subpath to the source file", () => {
    const text = `import { users } from "@repo/feature-users/schema";`;
    // Pass an absolute source file path so the resolver can find packages/.
    const resolver = buildImportResolver(
      resolve(repoRoot, "packages/feature-organizations/src/x.ts"),
      text,
    );
    const resolved = resolver("users");
    expect(resolved).toBe(
      resolve(repoRoot, "packages/feature-users/src/infrastructure/persistence/users.ts"),
    );
  });
});

describe("FK guard: exact source-table ownership", () => {
  it("rejects removal of one same-named property from a different table", () => {
    const source = `import { organizations } from "@repo/feature-organizations/schema";
import { pgTable, uuid } from "drizzle-orm/pg-core";
export const first = pgTable("first", {
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
});
export const second = pgTable("second", {
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
});`;
    const checks = [
      {
        sourceFile: "fixture.ts",
        sourceTableExport: "first",
        propertyName: "organizationId",
        physicalColumnName: "organization_id",
        targetFile: resolve(
          repoRoot,
          "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
        ),
        targetTableExport: "organizations",
        targetPropertyName: "id",
        nullable: true,
        onDelete: "cascade",
      },
      {
        sourceFile: "fixture.ts",
        sourceTableExport: "second",
        propertyName: "organizationId",
        physicalColumnName: "organization_id",
        targetFile: resolve(
          repoRoot,
          "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
        ),
        targetTableExport: "organizations",
        targetPropertyName: "id",
        nullable: true,
        onDelete: "cascade",
      },
    ];
    const removed = source.split("export const second")[0] ?? source;
    const failures = validateForeignKeys("fixture.ts", removed, checks, buildResolver());
    expect(failures).toHaveLength(1);
    expect(failures[0]?.reason).toMatch(/source table "second"/);
  });
});
