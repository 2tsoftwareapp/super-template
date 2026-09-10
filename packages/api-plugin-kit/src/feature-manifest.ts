import type { DynamicModule, Provider, Type } from "@nestjs/common";
import type { DatabaseReadConsistency, DatabaseRuntimeOptions, TenantMode } from "@repo/api-kernel";

/**
 * A feature package participates in the application by exporting exactly one
 * {@link FeatureManifest}. The manifest is the single, typed contract every
 * compile-time plugin honours across all four surfaces:
 *
 * - `nestModule` contributes the backend HTTP/application/domain slice.
 * - `schema` contributes the Drizzle tables the feature owns.
 * - `permissions` contributes RBAC permission keys the feature defines.
 * - `seeders` contributes optional bootstrap seed runners.
 * - `httpPipeline` contributes feature-owned global Nest guards/interceptors.
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

/** Authorization contribution contributed by a single feature. */
export interface FeatureAuthorizationResource {
  readonly scope: "platform" | "organization";
  readonly actions: readonly string[];
  /**
   * Default role grants keyed by stable platform role name (e.g. `"ADMIN"`).
   * `"*"` grants every action of this resource.
   */
  readonly defaultGrants?: Readonly<Record<string, readonly string[] | "*">>;
}

export interface ComposedAuthorization {
  /** resource -> contribution, deduplicated/conflict-checked at composition. */
  readonly resources: Readonly<Record<string, FeatureAuthorizationResource>>;
  /** role -> permission names (`resource.action`), SUPER_ADMIN excluded (implicit *). */
  readonly grantsByRole: Readonly<Record<string, readonly string[]>>;
}

/**
 * Feature-owned HTTP pipeline contributions.
 *
 * Each guard/interceptor is registered as a global `APP_GUARD` or
 * `APP_INTERCEPTOR`. The providers MUST use `useFactory` + `inject` with
 * injection TOKENS (not classes). This is because NestJS resolves
 * `APP_GUARD`/`APP_INTERCEPTOR` at the application root scope, and
 * `useExisting: GuardClass` fails when the guard's `@Inject(TOKEN)`
 * dependencies cannot be resolved from the registering module's scope.
 *
 * The factory receives tokens from the root scope (where @Global modules
 * register them) and manually creates the guard/interceptor instance.
 *
 * Example:
 * ```ts
 * httpPipeline: {
 *   guards: [{
 *     provide: APP_GUARD,
 *     useFactory: (reflector, authenticator) => new AuthGuard(reflector, authenticator),
 *     inject: [Reflector, ACCESS_TOKEN_AUTHENTICATOR],
 *   }],
 * }
 * ```
 */
export interface FeatureHttpPipeline {
  /**
   * Global guards contributed by this feature. Each must be a `Provider`
   * definition using `useFactory` + `inject` with injection tokens.
   */
  readonly guards?: readonly Provider[];
  /**
   * Global interceptors contributed by this feature. Each must be a
   * `Provider` definition using `useFactory` + `inject` with injection tokens.
   */
  readonly interceptors?: readonly Provider[];
}

/** Capability families understood by the application composition layer. */
export type FeatureCapabilityFamily = "tenant-isolation" | "database-topology";

/** Selector-facing metadata for a package-owned infrastructure capability. */
export interface FeatureCapability {
  readonly family: FeatureCapabilityFamily;
  readonly variant: string;
  readonly conflictsWith?: readonly string[];
}

/** Database topology contribution owned by a feature manifest. */
export interface FeatureDatabaseContribution {
  readonly tenantMode?: TenantMode;
  readonly readReplica?: boolean;
  readonly readConsistency?: DatabaseReadConsistency;
}

export interface FeatureManifest {
  /** Stable, unique feature id (kebab-case), e.g. `"audit"`, `"identity"`. */
  readonly id: string;

  /** Optional infrastructure capability metadata shown by the project selector. */
  readonly capability?: FeatureCapability;

  /** Optional database topology contribution composed by the application host. */
  readonly database?: FeatureDatabaseContribution;

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

  /**
   * Authorization contribution: resources, their scopes/actions and optional
   * default role grants. access-control consumes the composed result at seed
   * time — no central catalog knows feature resources in advance.
   */
  readonly authorization?: {
    readonly resources?: Readonly<Record<string, FeatureAuthorizationResource>>;
  };

  /**
   * Global HTTP pipeline contributions (guards/interceptors). Each provider
   * uses `useFactory` + `inject` with injection TOKENS. The composition
   * layer collects these and registers them as APP_GUARD/APP_INTERCEPTOR
   * in deterministic order based on `httpPipelineOrder`.
   */
  readonly httpPipeline?: FeatureHttpPipeline;

  /**
   * Ordering priority for this feature's HTTP pipeline contributions.
   * Lower numbers are registered first. Default is 100.
   * Features without pipeline contributions are ignored.
   */
  readonly httpPipelineOrder?: number;

  /** Optional seed runners contributed by this feature. */
  readonly seeders?: readonly FeatureSeeder[];

  /**
   * Outbox handler classes contributed by this feature. Each class must have
   * a static `topic: string` property and a `handle(message: OutboxMessage): Promise<void>` method.
   * Composition validates that no two handlers share the same topic.
   */
  readonly outboxHandlers?: readonly Type<unknown>[];
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
  /**
   * Composed authorization contributions (resources/grants) resolved BEFORE
   * seeding starts. Permission seeds must derive scopes from here at run()
   * time, never from import-time module state.
   */
  readonly authorization: ComposedAuthorization;
}

/**
 * Feature-owned seed contribution. The host builds {@link FeatureSeedContext};
 * the plugin kit stays free of Nest/CLI concrete types.
 */
export interface FeatureSeeder {
  readonly id: string;
  readonly run: (ctx: FeatureSeedContext) => Promise<void> | void;
}

/**
 * A single feature-contributed HTTP pipeline provider paired with its
 * registration priority (`httpPipelineOrder`). Keeping the order on the entry
 * lets the host interleave feature providers with generic providers
 * (e.g. ThrottlerGuard) by sorting one catalog, instead of assuming a fixed
 * array index. Lower `order` registers (and therefore runs) first.
 */
export interface HttpPipelineProviderEntry {
  readonly order: number;
  readonly provider: Provider;
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
  /** Merged authorization contributions (resources + default grants). */
  readonly authorization: ComposedAuthorization;
  /** Composed outbox handler classes in dependency order. */
  readonly outboxHandlerClasses: readonly Type<unknown>[];
  /**
   * HTTP pipeline guard providers collected from features, each paired with
   * its `httpPipelineOrder`. Providers are `useFactory` + `inject` definitions
   * with injection tokens; the host sorts this catalog together with generic
   * guard providers by `order` before registration.
   */
  readonly httpPipelineGuards: readonly HttpPipelineProviderEntry[];
  /**
   * HTTP pipeline interceptor providers collected from features, each paired
   * with its `httpPipelineOrder`. Providers are `useFactory` + `inject`
   * definitions with injection tokens.
   */
  readonly httpPipelineInterceptors: readonly HttpPipelineProviderEntry[];
  /** Database topology derived from the selected feature manifests. */
  readonly database: DatabaseRuntimeOptions;
}

/**
 * Identity helper that gives feature authors editor completion and a single,
 * greppable definition site. Returns the manifest unchanged at runtime.
 */
export function defineFeature(manifest: FeatureManifest): FeatureManifest {
  return manifest;
}

/**
 * Derive one database runtime topology from selected feature manifests. Tenant
 * modes are mutually exclusive; no contribution preserves the current
 * shared-schema and primary-only behavior.
 * @param features Selected manifests or their database contributions.
 * @returns The single database runtime option set for the selected graph.
 * @throws When selected manifests contribute incompatible tenant modes or read policies.
 */
export function composeDatabaseRuntimeOptions(
  features: readonly Pick<FeatureManifest, "id" | "database">[],
): DatabaseRuntimeOptions {
  const tenantModes = features.flatMap((feature) =>
    feature.database?.tenantMode ? [{ id: feature.id, mode: feature.database.tenantMode }] : [],
  );
  const uniqueModes = [...new Map(tenantModes.map((entry) => [entry.mode, entry])).values()];
  if (uniqueModes.length > 1) {
    throw new Error(
      "Conflicting tenant modes: " +
        tenantModes.map((entry) => entry.id + " (" + entry.mode + ")").join(", ") +
        ". Select exactly one tenant isolation mode.",
    );
  }

  const replicaContributions = features.flatMap((feature) =>
    feature.database?.readReplica ? [feature.database] : [],
  );
  const consistencyValues: DatabaseReadConsistency[] = [
    ...new Set(
      replicaContributions.map((contribution) => contribution.readConsistency ?? "eventual"),
    ),
  ];
  if (consistencyValues.length > 1) {
    throw new Error(
      "Conflicting database read consistency policies: " + consistencyValues.join(", ") + ".",
    );
  }

  const readReplica = replicaContributions.length > 0;
  return {
    tenantMode: uniqueModes[0]?.mode ?? "shared-schema",
    readReplica,
    readConsistency: readReplica ? (consistencyValues[0] ?? "eventual") : "strong",
  };
}

/**
 * Validate feature ids/deps, reject cycles, and return a deterministic
 * topological composition order. Tie-break preserves input order.
 */
export function orderFeatureManifests(features: readonly FeatureManifest[]): FeatureManifest[] {
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
        throw new Error(`Feature "${feature.id}" depends on missing feature "${dep}".`);
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
 * Merge per-feature authorization contributions. Duplicate resource ownership
 * is a composition error; grants must reference resources the SAME feature
 * contributes (a feature cannot grant what it does not own).
 */
export function composeFeatureAuthorization(
  features: readonly Pick<FeatureManifest, "id" | "authorization">[],
): ComposedAuthorization {
  const resources: Record<string, FeatureAuthorizationResource> = {};
  const owner = new Map<string, string>();

  for (const feature of features) {
    for (const [name, def] of Object.entries(feature.authorization?.resources ?? {})) {
      if (owner.has(name)) {
        throw new Error(
          `Resource "${name}" is contributed by both "${owner.get(name)}" and "${feature.id}". Resource ownership must be unique.`,
        );
      }
      owner.set(name, feature.id);
      resources[name] = def;
    }
  }

  for (const feature of features) {
    for (const [name, def] of Object.entries(feature.authorization?.resources ?? {})) {
      if (def.scope !== undefined && !["platform", "organization"].includes(def.scope)) {
        throw new Error(`Feature "${feature.id}" resource "${name}" has invalid scope.`);
      }
      const declaredActions = new Set(def.actions);
      for (const actions of Object.values(def.defaultGrants ?? {})) {
        const isWildcard =
          actions === "*" || (Array.isArray(actions) && actions.length === 1 && actions[0] === "*");
        if (!isWildcard) {
          for (const action of actions) {
            if (!declaredActions.has(action)) {
              throw new Error(
                `Feature "${feature.id}" resource "${name}" grants action "${action}" which is not in declared actions [${def.actions.join(", ")}].`,
              );
            }
          }
        }
      }
    }
  }

  const grantsByRole: Record<string, string[]> = {};
  for (const [name, def] of Object.entries(resources)) {
    for (const [role, actions] of Object.entries(def.defaultGrants ?? {})) {
      const list = grantsByRole[role] ?? (grantsByRole[role] = []);
      const isWildcard =
        actions === "*" || (Array.isArray(actions) && actions.length === 1 && actions[0] === "*");
      if (isWildcard) {
        for (const action of def.actions) list.push(`${name}.${action}`);
      } else {
        for (const action of actions) list.push(`${name}.${action}`);
      }
    }
  }
  for (const role of Object.keys(grantsByRole)) {
    grantsByRole[role] = [...new Set(grantsByRole[role])].sort();
  }

  return { resources, grantsByRole };
}

/**
 * Compute the reverse-dependency closure that must be removed together with
 * `omitId`: every feature whose `dependsOn` can only be
 * satisfied by a removed feature is removed transitively.
 */
export function computeRemovalClosure(
  features: readonly FeatureManifest[],
  omitIds: readonly string[],
): string[] {
  const removed = new Set<string>(omitIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const feature of features) {
      if (removed.has(feature.id)) continue;
      const dependsRemoved = (feature.dependsOn ?? []).some((d) => removed.has(d));
      if (dependsRemoved) {
        removed.add(feature.id);
        changed = true;
      }
    }
  }
  return [...removed].sort();
}

/**
 * Collect HTTP pipeline contributions from features in composition order.
 * Features with lower `httpPipelineOrder` contribute first; every contributed
 * provider is paired with its feature's order so hosts can merge feature and
 * generic providers in a single sorted catalog.
 */
export function collectFeatureHttpPipeline(features: readonly FeatureManifest[]): {
  guards: HttpPipelineProviderEntry[];
  interceptors: HttpPipelineProviderEntry[];
} {
  const sorted = [...features]
    .filter((f) => f.httpPipeline)
    .sort((a, b) => (a.httpPipelineOrder ?? 100) - (b.httpPipelineOrder ?? 100));

  const guards: HttpPipelineProviderEntry[] = [];
  const interceptors: HttpPipelineProviderEntry[] = [];

  for (const feature of sorted) {
    if (!feature.httpPipeline) continue;
    const order = feature.httpPipelineOrder ?? 100;
    for (const provider of feature.httpPipeline.guards ?? []) {
      guards.push({ order, provider });
    }
    for (const provider of feature.httpPipeline.interceptors ?? []) {
      interceptors.push({ order, provider });
    }
  }

  return { guards, interceptors };
}

/**
 * Full composition entrypoint used by the API host: validates ids/deps/cycles,
 * returns deterministic order, and merges schema/modules/permissions/seeders
 * and HTTP pipeline contributions.
 */
export function composeFeatures(features: readonly FeatureManifest[]): ComposedFeatures {
  const ordered = orderFeatureManifests(features);

  const handlerClasses: Type<unknown>[] = [];
  const topicMap = new Map<string, string[]>();

  for (const feature of ordered) {
    for (const handlerClass of feature.outboxHandlers ?? []) {
      const topic = (handlerClass as { readonly topic?: string }).topic;
      if (!topic) {
        throw new Error(
          `Outbox handler "${handlerClass.name}" in feature "${feature.id}" is missing static topic property.`,
        );
      }
      const existing = topicMap.get(topic) ?? [];
      existing.push(handlerClass.name);
      topicMap.set(topic, existing);
      handlerClasses.push(handlerClass);
    }
  }

  const duplicates = [...topicMap.entries()].filter(([, names]) => names.length > 1);
  if (duplicates.length > 0) {
    const details = duplicates
      .map(([topic, names]) => `topic "${topic}" by ${names.join(", ")}`)
      .join("; ");
    throw new Error(`Duplicate outbox ${details}.`);
  }

  const { guards, interceptors } = collectFeatureHttpPipeline(ordered);

  return {
    features: ordered,
    schema: composeFeatureSchemas(ordered),
    modules: collectFeatureModules(ordered),
    permissions: composeFeaturePermissions(ordered),
    seeders: collectFeatureSeeders(ordered),
    authorization: composeFeatureAuthorization(ordered),
    outboxHandlerClasses: handlerClasses,
    httpPipelineGuards: guards,
    httpPipelineInterceptors: interceptors,
    database: composeDatabaseRuntimeOptions(ordered),
  };
}
