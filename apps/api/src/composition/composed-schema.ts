import type { Type } from "@nestjs/common";

import { composeFeatures } from "@repo/api-plugin-kit";
import {
  type OutboxHandlerSlot,
  OutboxModule,
  type OutboxTopicHandlerClass,
} from "@repo/feature-outbox/contracts";

import { enabledFeatures } from "./feature-registry";

const composed = composeFeatures(enabledFeatures);

/** Drizzle schema composed from enabled feature manifests (deterministic order). */
export const composedSchema = composed.schema;

/**
 * Map each outbox handler class to the Nest module that exports it. The
 * composition layer needs to import those modules into the dynamic outbox
 * module so its bridge provider can resolve the handler instances.
 *
 * Convention: a feature's `nestModule` is responsible for re-exporting any
 * class it lists in `outboxHandlers`. Adding a new outbox handler therefore
 * requires zero composition-layer edits — the lookup falls back to the
 * feature's own module.
 */
const handlerProviderModule = new Map<unknown, Type<unknown>>();
for (const feature of composed.features) {
  if (!feature.outboxHandlers?.length) {
    continue;
  }
  const module = feature.nestModule;
  if (typeof module !== "function") {
    continue;
  }
  for (const handlerClass of feature.outboxHandlers) {
    handlerProviderModule.set(handlerClass, module);
  }
}

const handlerImportModules: Type<unknown>[] = [];
const seenModules = new Set<Type<unknown>>();
for (const handlerClass of composed.outboxHandlerClasses) {
  const provider = handlerProviderModule.get(handlerClass);
  if (!provider) {
    throw new Error(
      `Outbox handler "${(handlerClass as { name?: string }).name ?? String(handlerClass)}" has no providing Nest module. Each feature that contributes an outbox handler must export the handler class from its nestModule.`,
    );
  }
  if (!seenModules.has(provider)) {
    seenModules.add(provider);
    handlerImportModules.push(provider);
  }
}

/**
 * Nest modules in dependency order, with the outbox dynamic module
 * substituted for its placeholder so handler wiring is part of composition.
 */
export const featureModules: (typeof composed.modules)[number][] = composed.modules.map(
  (module, index) => {
    const manifest = composed.features[index];
    if (manifest?.id === "outbox") {
      const slots: OutboxHandlerSlot[] = composed.outboxHandlerClasses.map((handlerClass) => ({
        handlerClass: handlerClass as OutboxTopicHandlerClass,
      }));
      return OutboxModule.register({
        handlers: slots,
        imports: handlerImportModules,
      });
    }
    return module;
  },
);

/** Ordered manifests after dependency validation. */
export const orderedFeatures = composed.features;

/** Deduplicated permission keys from feature manifests. */
export const composedPermissions = composed.permissions;

/** Feature seeders in composition order. */
export const composedSeeders = composed.seeders;

/** Composed authorization contributions (resources + default grants). */
export const composedAuthorization = composed.authorization;

/** Composed outbox handler classes in dependency order. */
export const composedOutboxHandlers: readonly OutboxTopicHandlerClass[] =
  composed.outboxHandlerClasses as readonly OutboxTopicHandlerClass[];
