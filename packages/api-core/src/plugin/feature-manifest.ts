import type { DynamicModule, Type } from "@nestjs/common";

/**
 * A feature package participates in the application by exporting exactly one
 * {@link FeatureManifest}. The manifest is the single, typed contract every
 * compile-time plugin honours across all four surfaces:
 *
 * - `nestModule` contributes the backend HTTP/application/domain slice.
 * - `schema` contributes the Drizzle tables the feature owns.
 * - `permissions` contributes RBAC permission keys the feature defines.
 *
 * Frontend surfaces (admin/web nav, mobile routes) are wired through their own
 * per-surface exports in the same package; they are intentionally kept out of
 * this backend-only type so `@repo/api-core` never depends on React or Flutter.
 *
 * The application composes features by importing each manifest explicitly and
 * merging their contributions in one place (see `apps/api/src/features.ts`).
 * Removing a feature means removing its workspace dependency and the one line
 * that references its manifest — no kernel code changes.
 */
export interface FeatureManifest {
  /** Stable, unique feature id (kebab-case), e.g. `"audit"`, `"identity"`. */
  readonly id: string;

  /** The single public NestJS module surface the app wires into `imports[]`. */
  readonly nestModule: Type<unknown> | DynamicModule;

  /**
   * Drizzle tables owned by this feature, keyed by their schema name. These are
   * merged into the composed schema handed to `DatabaseModule.forRoot`.
   */
  readonly schema?: FeatureSchema;

  /** RBAC permission keys this feature defines (for documentation/seeding). */
  readonly permissions?: readonly string[];
}

/**
 * A feature's schema contribution. Kept structurally loose (a record of Drizzle
 * table objects) so the kernel does not need to know every feature's concrete
 * table types. The composed record is passed straight to `drizzle(pool, { schema })`.
 */
export type FeatureSchema = Record<string, unknown>;

/**
 * Identity helper that gives feature authors editor completion and a single,
 * greppable definition site. Returns the manifest unchanged at runtime.
 */
export function defineFeature(manifest: FeatureManifest): FeatureManifest {
  return manifest;
}

/**
 * Merge the schema contributions of several features into one flat record for
 * `DatabaseModule.forRoot({ schema })`. Throws on duplicate table keys so two
 * features can never silently claim the same table name.
 */
export function composeFeatureSchemas(
  features: readonly Pick<FeatureManifest, "id" | "schema">[],
): FeatureSchema {
  const composed: Record<string, unknown> = {};

  for (const feature of features) {
    if (!feature.schema) {
      continue;
    }

    for (const [tableName, table] of Object.entries(feature.schema)) {
      if (tableName in composed) {
        throw new Error(
          `Duplicate schema table "${tableName}" contributed by feature "${feature.id}". ` +
            `Table names must be unique across all composed features.`,
        );
      }

      composed[tableName] = table;
    }
  }

  return composed;
}

/**
 * Collect the Nest modules from a list of feature manifests, in order, for use
 * in an application module's `imports[]`.
 */
export function collectFeatureModules(
  features: readonly Pick<FeatureManifest, "nestModule">[],
): (Type<unknown> | DynamicModule)[] {
  return features.map((feature) => feature.nestModule);
}
