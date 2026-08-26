import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  organizationMemberRoleEnum,
  organizationMembers,
  organizations,
} from "./infrastructure/persistence";
import { OrganizationsModule } from "./organizations.module";

export const organizationsFeature: FeatureManifest = defineFeature({
  id: "organizations",
  dependsOn: ["access-control"],
  nestModule: OrganizationsModule,
  schema: { organizations, organizationMembers, organizationMemberRoleEnum },
});
