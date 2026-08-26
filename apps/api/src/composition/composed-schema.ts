import { composeFeatures } from "@repo/api-plugin-kit";

import { enabledFeatures } from "./feature-registry";

const composed = composeFeatures(enabledFeatures);

/** Drizzle schema composed from enabled feature manifests (deterministic order). */
export const composedSchema = composed.schema;

/** Nest modules in dependency order. */
export const featureModules = composed.modules;

/** Ordered manifests after dependency validation. */
export const orderedFeatures = composed.features;
