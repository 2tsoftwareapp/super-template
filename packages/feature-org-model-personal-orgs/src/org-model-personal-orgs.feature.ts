import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { OrgModelPersonalOrgsModule } from "./org-model-personal-orgs.module";

/**
 * Select the personal-organization model: every new user is provisioned a
 * personal organization and organization-scoped authorization, which makes
 * organizations effectively mandatory. Mutually exclusive with
 * `org-model-optional`.
 */
export const orgModelPersonalOrgsFeature: FeatureManifest = defineFeature({
  id: "org-model-personal-orgs",
  capability: {
    family: "organization-model",
    variant: "personal-orgs",
    conflictsWith: ["org-model-optional"],
  },
  organizationModel: {
    organizationModel: "personal-orgs",
  },
  nestModule: OrgModelPersonalOrgsModule,
});
