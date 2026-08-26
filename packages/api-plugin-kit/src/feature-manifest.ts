import type { DynamicModule, Type } from "@nestjs/common";

/**
 * A feature package participates in the application by exporting exactly one
 * {@link FeatureManifest}. The manifest is the single, typed contract every
 * compile-time plugin honours across all four surfaces:
 *
 * - `nestModule` contributes the backend HTTP/application/domain slice.
 * - `schema` contributes the Drizzle tables the feature owns.
 * - `permissions` contributes RBAC permission keys the feature defines.
 * - `seeders` contributes optional bootstrap seed runners.
 * - `dependsOn` declares other feature ids that must be composed first.
 *
 * Frontend surfaces (admin/web nav, mobile routes) are wired through their own
 * per-surface exports in the same package; they are intentionally kept out of
 * this backend-only type so the plugin kit never depends on React or Flutter.
 *
 * The application composes features by importing each manifest explicitly and
 * merging their contributions in one place (see `apps/api/src/composition`).
 * Removing a feature means removing its workspace dependency and the one line
 * that references its manifest — no kernel code changes.
 */
export interface FeatureManifest {
  /** Stable, unique feature id (kebab-case), e.g. `"audit"`, `"identity"`. */
  readonly id: string;

  /** The single public NestJS module surface the app wires into `imports[]`. */
  readonly nestModule: Type<unknown> | DynamicModule;

  /**
   * Feature ids that must be present and composed before this feature.
   * Validated by {@link composeFeatures} (missing deps + cycles rejected).
   */
  readonly dependsOn?: readonly string[];

  /**
   * Drizzle tables owned by this feature, keyed by their schema name. These are
   * merged into the composed schema handed to `DatabaseModule.forRoot`.
   */
  readonly schema?: FeatureSchema;

  /** RBAC permission keys this feature defines (for documentation/seeding). */
  readonly permissions?: readonly string[];

  /** Resource → scope map this feature owns (composed into the RBAC catalog). */
  readonly resourceScopes?: Readonly<Record<string, "platform" | "organization">>;

  /** Optional seed runners contributed by this feature. */
  readonly seeders?: readonly FeatureSeeder[];
}

/**
 * A feature's schema contribution. Kept structurally loose (a record of Drizzle
 * table objects) so the kernel does not need to know every feature's concrete
 * table types. The composed record is passed straight to `drizzle(pool, { schema })`.
 */
export type FeatureSchema = Record<string, unknown>;

/**
 * Runtime context the host passes to every {@link FeatureSeeder.run}.
 * Features resolve Nest providers via `app.get(...)` and may stash cross-seeder
 * values on the mutable `bag` (e.g. seeded user ids).
 */
export interface FeatureSeedContext {
  /**
   * Nest-like locator. Typed loosely so hosts can pass `INestApplicationContext`
   * without fighting Nest's overloaded `get` signature.
   */
  readonly app: {
    get: (
      token: string | symbol | (abstract new (...args: never[]) => unknown),
      ...rest: unknown[]
    ) => unknown;
  };
  /** Active DB executor (typically the seed transaction). */
  readonly executor: unknown;
  /** Mutable scratch pad shared across seeders in composition order. */
  readonly bag: Record<string, unknown>;
}

/**
 * Feature-owned seed contribution. The host builds {@link FeatureSeedContext};
 * the plugin kit stays free of Nest/CLI concrete types.
 */
export interface FeatureSeeder {
  readonly id: string;
  readonly run: (ctx: FeatureSeedContext) => Promise<void> | void;
}

export interface ComposedFeatures {
  /** Manifests in deterministic dependency order. */
  readonly features: readonly FeatureManifest[];
  /** Merged Drizzle schema from ordered features. */
  readonly schema: FeatureSchema;
  /** Nest modules in the same order as {@link features}. */
  readonly modules: (Type<unknown> | DynamicModule)[];
  /** Deduplicated permission keys preserving first-seen order. */
  readonly permissions: readonly string[];
  /** Seeders in composition order. */
  readonly seeders: readonly FeatureSeeder[];
  /** Merged resource scope catalog. */
  readonly resourceScopes: Readonly<Record<string, "platform" | "organization">>;
}

/**
 * Identity helper that gives feature authors editor completion and a single,
 * greppable definition site. Returns the manifest unchanged at runtime.
 */
export function defineFeature(manifest: FeatureManifest): FeatureManifest {
  return manifest;
}

/**
 * Validate feature ids/deps, reject cycles, and return a deterministic
 * topological composition order. Tie-break preserves input order.
 */
export function orderFeatureManifests(
  features: readonly FeatureManifest[],
): FeatureManifest[] {
  const byId = new Map<string, FeatureManifest>();
  const inputIndex = new Map<string, number>();

  for (let i = 0; i < features.length; i += 1) {
    const feature = features[i];
    if (!feature) {
      continue;
    }
    if (byId.has(feature.id)) {
      throw new Error(
        `Duplicate feature id "${feature.id}". Feature ids must be unique across the composed set.`,
      );
    }
    byId.set(feature.id, feature);
    inputIndex.set(feature.id, i);
  }

  for (const feature of features) {
    for (const dep of feature.dependsOn ?? []) {
      if (!byId.has(dep)) {
        throw new Error(
          `Feature "${feature.id}" depends on missing feature "${dep}".`,
        );
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: FeatureManifest[] = [];

  const visit = (id: string, stack: string[]): void => {
    if (visited.has(id)) {
      return;
    }
    if (visiting.has(id)) {
      const cycleStart = stack.indexOf(id);
      const cycle = [...stack.slice(cycleStart), id].join(" -> ");
      throw new Error(`Feature dependency cycle detected: ${cycle}`);
    }

    visiting.add(id);
    const feature = byId.get(id);
    if (!feature) {
      throw new Error(`Feature "${id}" is missing from the composition set.`);
    }

    const deps = [...(feature.dependsOn ?? [])].sort((a, b) => {
      return (inputIndex.get(a) ?? 0) - (inputIndex.get(b) ?? 0);
    });

    for (const dep of deps) {
      visit(dep, [...stack, id]);
    }

    visiting.delete(id);
    visited.add(id);
    ordered.push(feature);
  };

  const roots = [...features].sort(
    (a, b) => (inputIndex.get(a.id) ?? 0) - (inputIndex.get(b.id) ?? 0),
  );

  for (const feature of roots) {
    visit(feature.id, []);
  }

  return ordered;
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

/**
 * Collect permission keys across features, preserving first-seen order.
 */
export function composeFeaturePermissions(
  features: readonly Pick<FeatureManifest, "permissions">[],
): string[] {
  const seen = new Set<string>();
  const permissions: string[] = [];

  for (const feature of features) {
    for (const permission of feature.permissions ?? []) {
      if (seen.has(permission)) {
        continue;
      }
      seen.add(permission);
      permissions.push(permission);
    }
  }

  return permissions;
}

/**
 * Collect seeders across features in composition order.
 */

/**
 * Merge resource scope catalogs across features. Later duplicates must match.
 */
export function composeFeatureResourceScopes(
  features: readonly Pick<FeatureManifest, "id" | "resourceScopes">[],
): Record<string, "platform" | "organization"> {
  const composed: Record<string, "platform" | "organization"> = {};
  for (const feature of features) {
    for (const [resource, scope] of Object.entries(feature.resourceScopes ?? {})) {
      const existing = composed[resource];
      if (existing && existing !== scope) {
        throw new Error(
          `Conflicting resource scope for "${resource}" from feature "${feature.id}": ${existing} vs ${scope}`,
        );
      }
      composed[resource] = scope;
    }
  }
  return composed;
}

export function collectFeatureSeeders(
  features: readonly Pick<FeatureManifest, "seeders">[],
): FeatureSeeder[] {
  const seeders: FeatureSeeder[] = [];

  for (const feature of features) {
    if (!feature.seeders?.length) {
      continue;
    }
    seeders.push(...feature.seeders);
  }

  return seeders;
}

/**
 * Full composition entrypoint used by the API host: validates ids/deps/cycles,
 * returns deterministic order, and merges schema/modules/permissions/seeders.
 */
export function composeFeatures(features: readonly FeatureManifest[]): ComposedFeatures {
  const ordered = orderFeatureManifests(features);

  return {
    features: ordered,
    schema: composeFeatureSchemas(ordered),
    modules: collectFeatureModules(ordered),
    permissions: composeFeaturePermissions(ordered),
    seeders: collectFeatureSeeders(ordered),
    resourceScopes: composeFeatureResourceScopes(ordered),
  };
}
