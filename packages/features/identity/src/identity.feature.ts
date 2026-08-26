import { defineFeature, type FeatureManifest } from "@repo/api-core";

import { IdentityModule } from "./identity.module";

/**
 * Identity is the keystone bounded context (auth, users, organizations, RBAC,
 * MFA, SSO, preferences). It is extracted as a feature-plugin package but keeps
 * its tables in `@repo/api-database` because `m_users`/`m_organizations` are the
 * FK anchors every other feature references; the composed schema therefore still
 * carries identity tables via the built-in schema (manifest contributes none).
 */
export const identityFeature: FeatureManifest = defineFeature({
  id: "identity",
  nestModule: IdentityModule,
});
