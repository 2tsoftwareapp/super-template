/**
 * Compatibility exports for API-local consumers.
 * Composition is owned by @repo/app-composition so every host uses one graph.
 */
export {
  buildFeatureModules,
  composedAuthorization,
  composedHttpPipelineGuards,
  composedHttpPipelineInterceptors,
  composedOutboxHandlers,
  composedPermissions,
  composedSchema,
  composedSeeders,
  featureModules,
  orderedFeatures,
} from "@repo/app-composition";
