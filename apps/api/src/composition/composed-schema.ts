import { composeFeatures } from "@repo/api-plugin-kit";
import { setResourceScopeCatalog } from "@repo/api-runtime";

import { enabledFeatures } from "./feature-registry";

const composed = composeFeatures(enabledFeatures);
setResourceScopeCatalog(composed.resourceScopes);

/** Drizzle schema composed from enabled feature manifests (deterministic order). */
export const composedSchema = composed.schema;

/** Nest modules in dependency order. */
export const featureModules = composed.modules;

/** Ordered manifests after dependency validation. */
export const orderedFeatures = composed.features;

/** Deduplicated permission keys from feature manifests. */
export const composedPermissions = composed.permissions;

/** Feature seeders in composition order. */
export const composedSeeders = composed.seeders;
