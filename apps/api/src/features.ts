import {
  collectFeatureModules,
  composeFeatureSchemas,
  type FeatureManifest,
} from "@repo/api-core";
import { schema as builtinSchema } from "@repo/api-database";
import { healthFeature } from "@repo/api-health";
import { identityFeature } from "@repo/feature-identity";
import { platformFeature } from "@repo/feature-platform";

/**
 * Composition root for compile-time feature plugins.
 *
 * Each feature package (`@repo/feature-*`) exports a {@link FeatureManifest};
 * add it to {@link featureManifests} to enable the feature and remove it (plus
 * the workspace dependency in `package.json`) to disable it. `AppModule` never
 * references features directly — it only consumes the composed outputs below,
 * so the composition root stays thin (`app.module.ts` + `features.ts`).
 *
 * A manifest may contribute a Drizzle {@link FeatureManifest.schema}. Identity
 * and platform currently keep their tables in the built-in `@repo/api-database`
 * schema (identity because `m_users`/`m_organizations` are the FK anchors every
 * other feature references), so {@link composedSchema} merges the built-in
 * schema with any feature-contributed schema. As finer-grained features move
 * their tables into their own package the composed result stays identical.
 */
export const featureManifests: readonly FeatureManifest[] = [
  identityFeature,
  platformFeature,
  healthFeature,
];

/** Drizzle schema handed to `DatabaseModule.forRoot`, merged across all features. */
export const composedSchema: Record<string, unknown> = {
  ...builtinSchema,
  ...composeFeatureSchemas(featureManifests),
};

/** Nest modules contributed by enabled features, for `AppModule` `imports[]`. */
export const featureModules = collectFeatureModules(featureManifests);
