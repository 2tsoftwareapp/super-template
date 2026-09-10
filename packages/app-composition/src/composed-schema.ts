import type { Type } from "@nestjs/common";

import {
  composeFeatures,
  type FeatureManifest,
  type HttpPipelineProviderEntry,
} from "@repo/api-plugin-kit";
import {
  type OutboxHandlerSlot,
  OutboxModule,
  type OutboxTopicHandlerClass,
} from "@repo/feature-outbox/contracts";

import { enabledFeatures } from "./feature-registry";

const composed = composeFeatures(enabledFeatures);

/** Drizzle schema composed from enabled feature manifests in deterministic order. */
export const composedSchema = composed.schema;

/**
 * Resolve the handler-import module list for a set of outbox handler classes.
 * Each handler class must be provided by one of the feature modules in scope.
 */
function resolveHandlerImportModules(
  handlerClasses: readonly Type<unknown>[],
  features: readonly FeatureManifest[],
): Type<unknown>[] {
  const handlerProviderModule = new Map<unknown, Type<unknown>>();
  for (const feature of features) {
    if (!feature.outboxHandlers?.length) continue;
    const module = feature.nestModule;
    if (typeof module !== "function") continue;
    for (const handlerClass of feature.outboxHandlers) {
      handlerProviderModule.set(handlerClass, module);
    }
  }

  const modules: Type<unknown>[] = [];
  const seen = new Set<Type<unknown>>();
  for (const handlerClass of handlerClasses) {
    const provider = handlerProviderModule.get(handlerClass);
    if (!provider) {
      throw new Error(
        `Outbox handler "${(handlerClass as { name?: string }).name ?? String(handlerClass)}" has no providing Nest module.`,
      );
    }
    if (!seen.has(provider)) {
      seen.add(provider);
      modules.push(provider);
    }
  }
  return modules;
}

/**
 * Build the Nest module list from a feature manifest set, including dynamic
 * outbox handler registration. This is the single composition path for API,
 * worker, and omit-feature tests.
 */
export function buildFeatureModules(features: readonly FeatureManifest[]) {
  const composedSubset = composeFeatures(features);
  const importModules = resolveHandlerImportModules(
    composedSubset.outboxHandlerClasses,
    composedSubset.features,
  );

  const modules: (typeof composedSubset.modules)[number][] = composedSubset.modules.map(
    (module, index) => {
      const manifest = composedSubset.features[index];
      if (manifest?.id === "outbox") {
        const slots: OutboxHandlerSlot[] = composedSubset.outboxHandlerClasses.map(
          (handlerClass) => ({
            handlerClass: handlerClass as OutboxTopicHandlerClass,
          }),
        );
        return OutboxModule.register({ handlers: slots, imports: importModules });
      }
      return module;
    },
  );
  return {
    modules,
    features: composedSubset.features,
    schema: composedSubset.schema,
    permissions: composedSubset.permissions,
    seeders: composedSubset.seeders,
    authorization: composedSubset.authorization,
    outboxHandlerClasses: composedSubset.outboxHandlerClasses,
    httpPipelineGuards: composedSubset.httpPipelineGuards,
    httpPipelineInterceptors: composedSubset.httpPipelineInterceptors,
  };
}

const fullGraph = buildFeatureModules(enabledFeatures);

/** Full-graph feature modules in deterministic dependency order. */
export const featureModules = fullGraph.modules;

/** Ordered manifests after dependency validation. */
export const orderedFeatures = composed.features;

/** Deduplicated permission keys from feature manifests. */
export const composedPermissions = composed.permissions;

/** Feature seeders in composition order. */
export const composedSeeders = composed.seeders;

/** Composed authorization contributions. */
export const composedAuthorization = composed.authorization;

/** Composed outbox handler classes in dependency order. */
export const composedOutboxHandlers: readonly OutboxTopicHandlerClass[] =
  composed.outboxHandlerClasses as readonly OutboxTopicHandlerClass[];

/** Database topology selected by the enabled feature manifests. */
export const databaseRuntimeOptions = composed.database;

/** Raw HTTP pipeline guard contributions; each host normalizes host-specific tokens. */
export const composedHttpPipelineGuards: readonly HttpPipelineProviderEntry[] =
  fullGraph.httpPipelineGuards;

/** Raw HTTP pipeline interceptor contributions; each host normalizes host-specific tokens. */
export const composedHttpPipelineInterceptors: readonly HttpPipelineProviderEntry[] =
  fullGraph.httpPipelineInterceptors;
