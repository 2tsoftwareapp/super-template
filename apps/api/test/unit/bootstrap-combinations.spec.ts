import { Global, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { featureModules, orderedFeatures } from "../../src/composition/composed-schema";
import { enabledFeatures } from "../../src/composition/feature-registry";
import { composeFeatures } from "@repo/api-plugin-kit";
import { DATABASE } from "@repo/database-runtime";
import { USER_LOOKUP } from "@repo/feature-users/contracts";
import {
  ORGANIZATION_ACCESS_CONTROL,
  ORGANIZATION_CUSTOM_ROLES_PURGE,
  ORGANIZATION_USER_ROLES_PURGE,
} from "@repo/feature-organizations/contracts";
import { ACTIVITY_EMITTER } from "@repo/feature-activities/contracts";
import { AUDIT_WRITER } from "@repo/feature-audit/contracts";
import { OUTBOX_APPENDER } from "@repo/feature-outbox/contracts";
import {
  ADVISORY_LOCK_PORT,
  APP_LOGGER,
  EnvironmentService,
  ErrorReporterService,
  PLATFORM_TRANSACTION_PORT,
  TenantContextService,
  TRANSACTION_PORT,
} from "@repo/api-runtime";

const databaseFake = {
  query: async () => [],
  transaction: async (callback: (tx: unknown) => Promise<unknown>) => callback(databaseFake),
};

@Global()
@Module({
  providers: [
    { provide: DATABASE, useValue: databaseFake },
    {
      provide: PLATFORM_TRANSACTION_PORT,
      useValue: {
        run: async (callback: (tx: unknown) => Promise<unknown>) => callback(databaseFake),
      },
    },
    {
      provide: TRANSACTION_PORT,
      useValue: {
        run: async (callback: (tx: unknown) => Promise<unknown>) => callback(databaseFake),
      },
    },
    TenantContextService,
    { provide: APP_LOGGER, useValue: { debug() {}, info() {}, warn() {}, error() {} } },
    {
      provide: ADVISORY_LOCK_PORT,
      useValue: {
        withLock: async (_key: string, operation: () => Promise<unknown>) => operation(),
      },
    },
    { provide: USER_LOOKUP, useValue: { findById: async () => null } },
    { provide: OUTBOX_APPENDER, useValue: { append: async () => undefined } },
    {
      provide: ORGANIZATION_CUSTOM_ROLES_PURGE,
      useValue: { deleteByOrganizationId: async () => undefined },
    },
    {
      provide: ORGANIZATION_USER_ROLES_PURGE,
      useValue: { deleteByOrganizationId: async () => undefined },
    },
    {
      provide: ORGANIZATION_ACCESS_CONTROL,
      useValue: {
        ensureOrganizationAdminRole: async () => undefined,
        replaceUserRoles: async () => undefined,
        invalidateAccessProfile: async () => undefined,
      },
    },
    { provide: ACTIVITY_EMITTER, useValue: { emit: async () => undefined } },
    { provide: AUDIT_WRITER, useValue: { write: async () => undefined } },
    {
      provide: EnvironmentService,
      useValue: { isTest: true, values: { THROTTLER_TTL_MS: 60000, THROTTLER_LIMIT: 100 } },
    },
    { provide: ErrorReporterService, useValue: { captureException() {}, captureMessage() {} } },
  ],
  exports: [
    DATABASE,
    PLATFORM_TRANSACTION_PORT,
    TRANSACTION_PORT,
    TenantContextService,
    APP_LOGGER,
    ADVISORY_LOCK_PORT,
    USER_LOOKUP,
    OUTBOX_APPENDER,
    ORGANIZATION_CUSTOM_ROLES_PURGE,
    ORGANIZATION_USER_ROLES_PURGE,
    ORGANIZATION_ACCESS_CONTROL,
    ACTIVITY_EMITTER,
    AUDIT_WRITER,
    EnvironmentService,
    ErrorReporterService,
  ],
})
class DeterministicInfrastructureModule {}

async function compileGraph(modules: readonly (typeof featureModules)[number][]) {
  const moduleRef = await Test.createTestingModule({
    imports: [DeterministicInfrastructureModule, ...modules],
  }).compile();
  return moduleRef;
}

describe("deterministic Nest feature bootstrap matrix", () => {
  it("compiles and initializes the full composed feature graph without external infrastructure", async () => {
    const moduleRef = await compileGraph(featureModules);
    expect(orderedFeatures.length).toBeGreaterThan(1);
    expect(moduleRef.get(DATABASE)).toBe(databaseFake);
    await moduleRef.close();
  });

  it("uses the production-composed module list rather than a users-only substitute", () => {
    expect(featureModules.length).toBe(orderedFeatures.length);
    expect(orderedFeatures.map((feature) => feature.id)).toContain("user-management");
    expect(orderedFeatures.map((feature) => feature.id)).toContain("notifications");
  });

  it.each([
    ["auth", ["users"]],
    ["organizations", ["users"]],
    ["access-control", ["users"]],
    ["upload", ["users"]],
    ["activities", ["users"]],
    ["audit", ["users"]],
    ["notifications", ["users"]],
    ["health", ["users"]],
  ])(
    "composes and compiles the omit-feature acceptance closure for %s",
    async (omitted, required) => {
      const byId = new Map(orderedFeatures.map((feature) => [feature.id, feature]));
      const removed = new Set([omitted]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const feature of orderedFeatures) {
          if (
            feature.dependsOn?.some((dependency) => removed.has(dependency)) &&
            !removed.has(feature.id)
          ) {
            removed.add(feature.id);
            changed = true;
          }
        }
      }
      const remaining = orderedFeatures.filter((feature) => !removed.has(feature.id));
      expect(remaining.map((feature) => feature.id)).toEqual(expect.arrayContaining(required));
      expect(byId.has(omitted)).toBe(true);
      const composed = composeFeatures(
        enabledFeatures.filter((feature) => !removed.has(feature.id)),
      );
      const moduleRef = await compileGraph(composed.modules);
      expect(composed.features.map((feature) => feature.id)).not.toContain(omitted);
      await moduleRef.close();
    },
  );
});
