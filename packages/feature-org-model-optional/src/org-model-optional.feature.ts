import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { OrgModelOptionalModule } from "./org-model-optional.module";

/**
 * Select the organization-optional authorization model: users exist and
 * operate without an organization, which becomes an opt-in module they join
 * when needed. Mutually exclusive with `org-model-personal-orgs`.
 */
export const orgModelOptionalFeature: FeatureManifest = defineFeature({
  id: "org-model-optional",
  capability: {
    family: "organization-model",
    variant: "org-optional",
    conflictsWith: ["org-model-personal-orgs"],
  },
  organizationModel: {
    organizationModel: "org-optional",
  },
  nestModule: OrgModelOptionalModule,
});
