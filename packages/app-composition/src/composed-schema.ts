import type { Provider, Type } from "@nestjs/common";

import { Reflector } from "@nestjs/core";
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
 * Normalize a single HTTP pipeline provider to the host's Reflector class.
 */
function normalizePipelineProvider(provider: Provider): Provider {
  if (
    provider &&
    typeof provider === "object" &&
    "inject" in provider &&
    Array.isArray((provider as { inject?: unknown[] }).inject)
  ) {
    const inject = (provider as { inject: unknown[] }).inject.map((token) => {
      if (typeof token === "function" && "name" in token && token.name === "Reflector") {
        return Reflector;
      }
      return token;
    });
    return { ...provider, inject } as Provider;
  }
  return provider;
}

/** Normalize all feature HTTP pipeline entries for a host. */
function normalizePipelineEntries(
  entries: readonly HttpPipelineProviderEntry[],
): HttpPipelineProviderEntry[] {
  return entries.map((entry) => ({
    order: entry.order,
    provider: normalizePipelineProvider(entry.provider),
  }));
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

/** Ordered HTTP pipeline guard contributions. */
export const composedHttpPipelineGuards: readonly HttpPipelineProviderEntry[] =
  normalizePipelineEntries(fullGraph.httpPipelineGuards);

/** Ordered HTTP pipeline interceptor contributions. */
export const composedHttpPipelineInterceptors: readonly HttpPipelineProviderEntry[] =
  normalizePipelineEntries(fullGraph.httpPipelineInterceptors);
