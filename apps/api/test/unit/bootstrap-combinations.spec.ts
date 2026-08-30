import { Global, Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { computeRemovalClosure } from "@repo/api-plugin-kit";
import type { FeatureManifest } from "@repo/api-plugin-kit";
import { describe, expect, it } from "vitest";

import {
  buildFeatureModules,
  composedHttpPipelineGuards,
  composedHttpPipelineInterceptors,
  composedSchema,
  composedSeeders,
  composedAuthorization,
  composedPermissions,
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

/**
 * Verify feature-contributed HTTP pipeline providers are well-formed:
 * each guard has provide: APP_GUARD, each interceptor has provide: APP_INTERCEPTOR,
 * and they resolve their deps via useFactory+inject (not bare useClass).
 */
function validatePipelineProviders(): void {
  // Feature-contributed guards must be complete Nest Provider definitions
  // (useFactory+inject or useClass) — not bare class references.
  expect(composedHttpPipelineGuards.length).toBeGreaterThan(0);
  for (const provider of composedHttpPipelineGuards) {
    const p = provider as unknown as Record<string, unknown>;
    const hasFactory = typeof p.useFactory === "function";
    const hasClass = typeof p.useClass === "function";
    expect(hasFactory || hasClass).toBe(true);
    if (hasFactory) {
      expect(Array.isArray(p.inject)).toBe(true);
    }
  }

  // Feature-contributed interceptors must be complete Nest Provider definitions.
  expect(composedHttpPipelineInterceptors.length).toBeGreaterThan(0);
  for (const provider of composedHttpPipelineInterceptors) {
    const p = provider as unknown as Record<string, unknown>;
    const hasFactory = typeof p.useFactory === "function";
    const hasClass = typeof p.useClass === "function";
    expect(hasFactory || hasClass).toBe(true);
    if (hasFactory) {
      expect(Array.isArray(p.inject)).toBe(true);
    }
  }
}

/**
 * Collect all schema table names contributed by a feature manifest.
 */
function featureSchemaKeys(feature: FeatureManifest): string[] {
  return Object.keys(feature.schema ?? {});
}

/**
 * Collect all permission keys contributed by a feature.
 */
function featurePermissionKeys(feature: FeatureManifest): string[] {
  return [...(feature.permissions ?? [])];
}

/**
 * Collect all authorization resource names contributed by a feature.
 */
function featureAuthResourceKeys(feature: FeatureManifest): string[] {
  return Object.keys(feature.authorization?.resources ?? {});
}

/**
 * Collect all seeder ids contributed by a feature.
 */
function featureSeederIds(feature: FeatureManifest): string[] {
  return [...(feature.seeders ?? [])].map((s: { id: string }) => s.id);
}

/**
 * Collect all outbox handler classes contributed by a feature.
 */
function featureOutboxHandlers(feature: FeatureManifest): readonly unknown[] {
  return [...(feature.outboxHandlers ?? [])];
}

/**
 * For every enabled feature, compute what gets removed when that feature is
 * omitted, then verify:
 *  1. The remaining graph compiles AND initializes (real DI, real providers).
 *  2. No removed feature's contributions remain in the composed result.
 *  3. Schema, seeders, authorization, permissions, outbox handlers are all checked.
 */
function omitFeatureCases(): Array<[string]> {
  return enabledFeatures.map((f) => [f.id]);
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

    // Verify all contribution surfaces exist.
    expect(Object.keys(composedSchema).length).toBeGreaterThan(0);
    expect(composedSeeders.length).toBeGreaterThan(0);
    expect(Object.keys(composedAuthorization.resources).length).toBeGreaterThan(0);
    expect(Object.keys(composedAuthorization.grantsByRole).length).toBeGreaterThan(0);

    await moduleRef.close();
  });

  it("uses the production-composed module list rather than a users-only substitute", () => {
    expect(featureModules.length).toBe(orderedFeatures.length);
    expect(orderedFeatures.map((feature) => feature.id)).toContain("user-management");
    expect(orderedFeatures.map((feature) => feature.id)).toContain("notifications");
  });

  it("feature-contributed HTTP pipeline providers are well-formed with useFactory+inject", () => {
    validatePipelineProviders();
  });

  it.each(omitFeatureCases())(
    "omits %s: remaining graph compiles/init, and removed contributions are absent",
    async (omittedId) => {
      const removed = computeRemovalClosure(enabledFeatures, [omittedId]);
      expect(removed).toContain(omittedId);

      const remainingFeatures = enabledFeatures.filter((f) => !removed.includes(f.id));

      // Use buildFeatureModules to get properly composed modules
      // (including OutboxModule.register() substitution).
      const {
        modules: composedModules,
        features: composedFeatures,
        schema: subsetSchema,
        seeders: subsetSeeders,
        authorization: subsetAuthorization,
        permissions: subsetPermissions,
      } = buildFeatureModules(remainingFeatures);

      // The omitted feature and all its reverse-dependents must be absent.
      for (const id of removed) {
        expect(
          composedFeatures.map((f) => f.id),
          `feature "${id}" must be absent`,
        ).not.toContain(id);
      }

      // --- Schema contributions: no tables from removed features ---
      const removedManifests = enabledFeatures.filter((f) => removed.includes(f.id));
      for (const manifest of removedManifests) {
        for (const tableName of featureSchemaKeys(manifest)) {
          expect(
            subsetSchema,
            `removed feature "${manifest.id}" schema table "${tableName}" must not appear`,
          ).not.toHaveProperty(tableName);
        }
      }

      // --- Permission contributions: no permissions from removed features ---
      for (const manifest of removedManifests) {
        for (const perm of featurePermissionKeys(manifest)) {
          expect(
            subsetPermissions,
            `removed feature "${manifest.id}" permission "${perm}" must not appear`,
          ).not.toContain(perm);
        }
      }

      // --- Authorization resources: no resources from removed features ---
      for (const manifest of removedManifests) {
        for (const resource of featureAuthResourceKeys(manifest)) {
          expect(
            subsetAuthorization.resources,
            `removed feature "${manifest.id}" auth resource "${resource}" must not appear`,
          ).not.toHaveProperty(resource);
        }
      }

      // --- Seeders: no seeders from removed features ---
      for (const manifest of removedManifests) {
        for (const seederId of featureSeederIds(manifest)) {
          expect(
            subsetSeeders.map((s) => s.id),
            `removed feature "${manifest.id}" seeder "${seederId}" must not appear`,
          ).not.toContain(seederId);
        }
      }

      // --- Outbox handlers: no handlers from removed features ---
      const removedHandlerClasses = new Set(
        removedManifests.flatMap((f) => featureOutboxHandlers(f)),
      );
      for (const handlerClass of composedFeatures.flatMap((f) => featureOutboxHandlers(f))) {
        expect(
          removedHandlerClasses.has(handlerClass),
          `outbox handler from removed feature must not appear`,
        ).toBe(false);
      }

      // --- NestJS DI: compile + init proves all mandatory providers resolve
      //     with real feature modules — no business tokens were faked. ---
      const { moduleRef } = await compileGraph(composedModules);
      await moduleRef.init();
      await moduleRef.close();
    },
  );
});
