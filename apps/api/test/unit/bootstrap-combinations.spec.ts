import type { DynamicModule, Provider, Type } from "@nestjs/common";
import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { computeRemovalClosure } from "@repo/api-plugin-kit";
import type { FeatureManifest, HttpPipelineProviderEntry } from "@repo/api-plugin-kit";
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
import { buildOrderedGuardCatalog } from "../../src/composition/global-pipeline";
import { DATABASE } from "@repo/database-runtime";
import { ADVISORY_LOCK_PORT, APP_LOGGER, PLATFORM_TRANSACTION_PORT, TRANSACTION_PORT } from "@repo/api-kernel";
import { EnvironmentService, ErrorReporterService, TenantContextService } from "@repo/api-runtime";

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
 * each entry pairs an `order` with a `useFactory` + `inject` provider (not a
 * bare class reference), and feature guards are ordered by `httpPipelineOrder`.
 */
function validatePipelineProviders(): void {
  // Guards: settings (10) must sort before auth (20).
  expect(composedHttpPipelineGuards.length).toBeGreaterThan(0);
  const guardOrders = composedHttpPipelineGuards.map((entry) => entry.order);
  expect([...guardOrders].sort((a, b) => a - b)).toEqual(guardOrders);
  for (const entry of composedHttpPipelineGuards) {
    const p = entry.provider as unknown as FactoryProviderShape;
    expect(p.provide).toBeDefined();
    expect(typeof p.useFactory).toBe("function");
    expect(Array.isArray(p.inject)).toBe(true);
    expect(p.inject!.length).toBeGreaterThan(0);
  }

  // Interceptors
  expect(composedHttpPipelineInterceptors.length).toBeGreaterThan(0);
  const interceptorOrders = composedHttpPipelineInterceptors.map((entry) => entry.order);
  expect([...interceptorOrders].sort((a, b) => a - b)).toEqual(interceptorOrders);
  for (const entry of composedHttpPipelineInterceptors) {
    const p = entry.provider as unknown as FactoryProviderShape;
    expect(p.provide).toBeDefined();
    expect(typeof p.useFactory).toBe("function");
    expect(Array.isArray(p.inject)).toBe(true);
    expect(p.inject!.length).toBeGreaterThan(0);
  }
}

/** Minimal shape for asserting provider structure without NestJS internals. */
interface FactoryProviderShape {
  provide: unknown;
  useFactory: (...args: unknown[]) => unknown;
  inject?: unknown[];
}

/**
 * Host-merged guard catalog orders for a given feature-guard order set.
 * Generic guards occupy fixed slots: throttler=15, authorize=25.
 */
function catalogOrders(featureGuards: readonly HttpPipelineProviderEntry[]): number[] {
  return buildOrderedGuardCatalog(featureGuards).map((entry) => entry.order);
}

/**
 * Classifies host-merged catalog entries by their fixed slot: generic guards
 * occupy order 15 (throttler) and 25 (authorize); other orders are feature
 * contributions.
 */
function catalogKinds(featureGuards: readonly HttpPipelineProviderEntry[]): string[] {
  return buildOrderedGuardCatalog(featureGuards).map((entry) =>
    entry.order === 15 || entry.order === 25 ? "generic" : "feature",
  );
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

  it("host guard catalog keeps feature guards sorted with generic throttler (15) and authorize (25) slots", () => {
    // Full graph: feature guards (settings=10, auth=20) merge to 10/15/20/25.
    const featureOrders = composedHttpPipelineGuards.map((g) => g.order);
    expect([...featureOrders].sort((a, b) => a - b)).toEqual(featureOrders);
    expect(catalogOrders(composedHttpPipelineGuards)).toEqual([...featureOrders, 15, 25].sort((a, b) => a - b));
    expect(catalogOrders(composedHttpPipelineGuards)).toEqual([10, 15, 20, 25]);
    expect(catalogKinds(composedHttpPipelineGuards).filter((k) => k === "generic")).toHaveLength(2);
  });

  it("omitting settings removes its guard and all dependents via closure (no orphan guard)", () => {
    const removed = computeRemovalClosure(enabledFeatures, ["settings"]);
    const remaining = enabledFeatures.filter((f) => !removed.includes(f.id));
    const { modules, httpPipelineGuards } = buildFeatureModules(remaining);

    // Settings (order 10) removal closes over auth (its dependent, order 20),
    // so no feature guard with order 20 may survive on its own.
    expect(removed).toContain("settings");
    expect(httpPipelineGuards).toEqual([]);

    // Even with feature guards gone, generic throttler (15) + authorize (25) stay.
    expect(catalogOrders(httpPipelineGuards)).toEqual([15, 25]);
    void modules;
  });

  it("a guard with order below throttler still registers first (numeric, not index)", () => {
    const fakeGuard = { provide: APP_GUARD, useFactory: () => ({ canActivate: () => true }), inject: [] };
    const subset = [{ order: 5, provider: fakeGuard }, ...composedHttpPipelineGuards];
    expect(catalogOrders(subset)).toEqual([5, 10, 15, 20, 25]);
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
            subsetGuards.map((g) => g.provider),
            `removed feature "${manifest.id}" guard must not appear`,
          ).not.toContain(guardProvider);
        }
        for (const interceptorProvider of manifest.httpPipeline?.interceptors ?? []) {
          expect(
            subsetInterceptors.map((g) => g.provider),
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
