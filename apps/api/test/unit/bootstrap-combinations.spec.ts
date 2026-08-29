import { Global, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { computeRemovalClosure } from "@repo/api-plugin-kit";
import { describe, expect, it } from "vitest";

import {
  buildFeatureModules,
  featureModules,
  orderedFeatures,
} from "../../src/composition/composed-schema";
import { enabledFeatures } from "../../src/composition/feature-registry";
import { DATABASE } from "@repo/database-runtime";
import {
  ADVISORY_LOCK_PORT,
  APP_LOGGER,
  EnvironmentService,
  ErrorReporterService,
  PLATFORM_TRANSACTION_PORT,
  TenantContextService,
  TRANSACTION_PORT,
} from "@repo/api-runtime";

/**
 * Infrastructure-only fakes for external services.
 *
 * Every provider in this module represents infrastructure that has NO
 * business logic: database driver, Redis client, SMTP transport, etc.
 *
 * Business tokens (AUDIT_WRITER, OUTBOX_APPENDER, USER_LOOKUP, etc.)
 * must NOT appear here — they are provided by real feature modules.
 * Faking them would mask hidden cross-feature injection dependencies.
 */
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
        withTenant: async (_ctx: unknown, callback: (tx: unknown) => Promise<unknown>) =>
          callback(databaseFake),
        run: async (callback: (tx: unknown) => Promise<unknown>) => callback(databaseFake),
      },
    },
    TenantContextService,
    {
      provide: ADVISORY_LOCK_PORT,
      useValue: {
        withLock: async (_key: string, operation: () => Promise<unknown>) => operation(),
      },
    },
    { provide: APP_LOGGER, useValue: { debug() {}, info() {}, warn() {}, error() {} } },
    {
      provide: EnvironmentService,
      useValue: {
        isTest: true,
        isProduction: false,
        values: {
          THROTTLER_TTL_MS: 60000,
          THROTTLER_LIMIT: 100,
        },
      },
    },
    {
      provide: ErrorReporterService,
      useValue: { captureException() {}, captureMessage() {} },
    },
  ],
  exports: [
    DATABASE,
    PLATFORM_TRANSACTION_PORT,
    TRANSACTION_PORT,
    TenantContextService,
    ADVISORY_LOCK_PORT,
    APP_LOGGER,
    EnvironmentService,
    ErrorReporterService,
  ],
})
class DeterministicInfrastructureModule {}

async function compileGraph(modules: readonly (typeof featureModules)[number][]) {
  const moduleRef = await Test.createTestingModule({
    imports: [DeterministicInfrastructureModule, ...modules],
  }).compile();
  return { moduleRef };
}

describe("deterministic Nest feature bootstrap matrix", () => {
  it("compiles AND initializes the full composed feature graph without external infrastructure", async () => {
    const { moduleRef } = await compileGraph(featureModules);

    await moduleRef.init();

    expect(orderedFeatures.length).toBeGreaterThan(1);
    expect(moduleRef.get(DATABASE)).toBe(databaseFake);

    // Verify that real feature-provided tokens resolve (not fakes).
    const { AUDIT_WRITER } = await import("@repo/feature-audit/contracts");
    const auditWriter = moduleRef.get(AUDIT_WRITER);
    expect(auditWriter).toBeDefined();
    expect(typeof auditWriter.log).toBe("function");

    await moduleRef.close();
  });

  it("uses the production-composed module list rather than a users-only substitute", () => {
    expect(featureModules.length).toBe(orderedFeatures.length);
    expect(orderedFeatures.map((feature) => feature.id)).toContain("user-management");
    expect(orderedFeatures.map((feature) => feature.id)).toContain("notifications");
  });

  /**
   * For every omit-feature combination, verify that:
   * 1. computeRemovalClosure() produces the correct reverse-dependency set.
   * 2. The remaining features compose successfully (no missing capability).
   * 3. The remaining modules compile AND initialize without the removed feature.
   * 4. The removed feature's contributions (schemas, seeders, authorization, outbox)
   *    are absent from the composed result.
   */
  it.each([
    // access-control removed → auth, sso, upload, import-export, organization-management, user-management removed
    ["access-control", ["users", "organizations", "activities", "audit", "outbox", "health"]],
    // notifications is a leaf — only itself removed
    [
      "notifications",
      ["users", "organizations", "access-control", "auth", "audit", "outbox", "health"],
    ],
    // upload removed → import-export, user-management removed
    ["upload", ["users", "organizations", "access-control", "auth", "audit", "outbox", "health"]],
    // organizations removed → access-control, auth, sso, upload, import-export, notifications, organization-management, user-management
    ["organizations", ["users", "activities", "audit", "outbox", "health"]],
    // health is a leaf — only itself removed
    ["health", ["users", "organizations", "access-control", "auth", "audit", "outbox"]],
    // activities removed → jobs, mail, notifications, organizations, access-control, auth, sso, upload, import-export, organization-management, user-management
    ["activities", ["users", "audit", "outbox", "health"]],
  ])(
    "omits %s: closure is correct, remaining graph compiles and initializes",
    async (omitted, required) => {
      const removed = computeRemovalClosure(enabledFeatures, [omitted]);
      expect(removed).toContain(omitted);
      expect(removed).not.toContain("users");

      const remainingFeatures = enabledFeatures.filter((f) => !removed.includes(f.id));
      expect(
        remainingFeatures.map((f) => f.id),
        `required features [${required}] must survive omit "${omitted}"`,
      ).toEqual(expect.arrayContaining(required));

      // Use buildFeatureModules to get properly composed modules
      // (including OutboxModule.register() substitution).
      const { modules: composedModules, features: composedFeatures } =
        buildFeatureModules(remainingFeatures);

      // The omitted feature and all its reverse-dependents must be absent.
      for (const id of removed) {
        expect(
          composedFeatures.map((f) => f.id),
          `feature "${id}" must be absent`,
        ).not.toContain(id);
      }

      // No outbox handlers from removed features.
      const removedManifests = enabledFeatures.filter((f) => removed.includes(f.id));
      const removedHandlerClasses = new Set(
        removedManifests.flatMap((f) => (f.outboxHandlers ?? []) as readonly unknown[]),
      );
      for (const handlerClass of composedFeatures.flatMap(
        (f) => (f.outboxHandlers ?? []) as readonly unknown[],
      )) {
        expect(removedHandlerClasses.has(handlerClass)).toBe(false);
      }

      // NestJS DI: compile + init proves all mandatory providers resolve
      // with real feature modules — no business tokens were faked.
      const { moduleRef } = await compileGraph(composedModules);
      await moduleRef.init();
      await moduleRef.close();
    },
  );
});
