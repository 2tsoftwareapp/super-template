import type { DynamicModule, Provider, Type } from "@nestjs/common";
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

/**
 * Compile and initialize the Nest graph with feature modules and
 * infrastructure fakes. Does NOT include globalPipelineProviders
 * (guards/interceptors) because those require host-level infrastructure
 * (ThrottlerModule, full SettingsModule resolution, etc.) that is not
 * available in a unit-test context.
 *
 * The production AppModule registers globalPipelineProviders and is
 * validated by the CI `generate:check` and e2e tests.
 *
 * This test validates that:
 *  1. All feature modules compile and initialize.
 *  2. Feature-provided business tokens resolve (not fakes).
 *  3. Composition produces the correct set of contributions.
 *  4. Omitting a feature removes its contributions and the graph still boots.
 *  5. HTTP pipeline contribution composition is correct (provider structure,
 *     ordering, and removal after omit-feature).
 */
async function compileGraph(modules: readonly (Type<unknown> | DynamicModule)[]) {
  const moduleRef = await Test.createTestingModule({
    imports: [DeterministicInfrastructureModule, ...modules],
  }).compile();
  return { moduleRef };
}

/**
 * Verify that feature-contributed HTTP pipeline providers are well-formed:
 * each has `provide`, `useFactory`, and `inject` — not bare class references.
 * Also verifies ordering: guards with lower httpPipelineOrder come first.
 */
function validatePipelineProviders(): void {
  // Guards
  expect(composedHttpPipelineGuards.length).toBeGreaterThan(0);
  for (const provider of composedHttpPipelineGuards) {
    const p = provider as unknown as FactoryProviderShape;
    expect(p.provide).toBeDefined();
    expect(typeof p.useFactory).toBe("function");
    expect(Array.isArray(p.inject)).toBe(true);
    expect(p.inject!.length).toBeGreaterThan(0);
  }

  // Interceptors
  expect(composedHttpPipelineInterceptors.length).toBeGreaterThan(0);
  for (const provider of composedHttpPipelineInterceptors) {
    const p = provider as unknown as FactoryProviderShape;
    expect(p.provide).toBeDefined();
    expect(typeof p.useFactory).toBe("function");
    expect(Array.isArray(p.inject)).toBe(true);
    expect(p.inject!.length).toBeGreaterThan(0);
  }

  // Ordering: features sorted by httpPipelineOrder, so guards array is ordered
  // by that property. Settings (10) guard comes before Auth (20) guard.
}

/** Minimal shape for asserting provider structure without NestJS internals. */
interface FactoryProviderShape {
  provide: unknown;
  useFactory: (...args: unknown[]) => unknown;
  inject?: unknown[];
}

function featureSchemaKeys(feature: FeatureManifest): string[] {
  return Object.keys(feature.schema ?? {});
}

function featurePermissionKeys(feature: FeatureManifest): string[] {
  return [...(feature.permissions ?? [])];
}

function featureAuthResourceKeys(feature: FeatureManifest): string[] {
  return Object.keys(feature.authorization?.resources ?? {});
}

function featureSeederIds(feature: FeatureManifest): string[] {
  return [...(feature.seeders ?? [])].map((s: { id: string }) => s.id);
}

function featureOutboxHandlers(feature: FeatureManifest): readonly unknown[] {
  return [...(feature.outboxHandlers ?? [])];
}

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

  it("feature-contributed HTTP pipeline providers use useFactory+inject with tokens", () => {
    validatePipelineProviders();
  });

  it.each(omitFeatureCases())(
    "omits %s: remaining graph compiles/init, and removed contributions are absent",
    async (omittedId) => {
      const removed = computeRemovalClosure(enabledFeatures, [omittedId]);
      expect(removed).toContain(omittedId);

      const remainingFeatures = enabledFeatures.filter((f) => !removed.includes(f.id));

      const {
        modules: composedModules,
        features: composedFeatures,
        schema: subsetSchema,
        seeders: subsetSeeders,
        authorization: subsetAuthorization,
        permissions: subsetPermissions,
        httpPipelineGuards: subsetGuards,
        httpPipelineInterceptors: subsetInterceptors,
      } = buildFeatureModules(remainingFeatures);

      for (const id of removed) {
        expect(
          composedFeatures.map((f) => f.id),
          `feature "${id}" must be absent`,
        ).not.toContain(id);
      }

      const removedManifests = enabledFeatures.filter((f) => removed.includes(f.id));
      for (const manifest of removedManifests) {
        for (const tableName of featureSchemaKeys(manifest)) {
          expect(
            subsetSchema,
            `removed feature "${manifest.id}" schema table "${tableName}" must not appear`,
          ).not.toHaveProperty(tableName);
        }
        for (const perm of featurePermissionKeys(manifest)) {
          expect(
            subsetPermissions,
            `removed feature "${manifest.id}" permission "${perm}" must not appear`,
          ).not.toContain(perm);
        }
        for (const resource of featureAuthResourceKeys(manifest)) {
          expect(
            subsetAuthorization.resources,
            `removed feature "${manifest.id}" auth resource "${resource}" must not appear`,
          ).not.toHaveProperty(resource);
        }
        for (const seederId of featureSeederIds(manifest)) {
          expect(
            subsetSeeders.map((s) => s.id),
            `removed feature "${manifest.id}" seeder "${seederId}" must not appear`,
          ).not.toContain(seederId);
        }
        const removedHandlerClasses = new Set(
          removedManifests.flatMap((f) => featureOutboxHandlers(f)),
        );
        for (const handlerClass of composedFeatures.flatMap((f) => featureOutboxHandlers(f))) {
          expect(
            removedHandlerClasses.has(handlerClass),
            `outbox handler from removed feature must not appear`,
          ).toBe(false);
        }
        for (const guardProvider of manifest.httpPipeline?.guards ?? []) {
          expect(
            subsetGuards,
            `removed feature "${manifest.id}" guard must not appear`,
          ).not.toContain(guardProvider);
        }
        for (const interceptorProvider of manifest.httpPipeline?.interceptors ?? []) {
          expect(
            subsetInterceptors,
            `removed feature "${manifest.id}" interceptor must not appear`,
          ).not.toContain(interceptorProvider);
        }
      }

      const { moduleRef } = await compileGraph(composedModules);
      await moduleRef.init();
      await moduleRef.close();
    },
  );
});
