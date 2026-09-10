import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { TenantSharedSchemaModule } from "./tenant-shared-schema.module";

/** Select the default shared-schema tenant isolation strategy. */
export const tenantSharedSchemaFeature: FeatureManifest = defineFeature({
  id: "tenant-shared-schema",
  capability: {
    family: "tenant-isolation",
    variant: "shared-schema",
    conflictsWith: ["tenant-schema"],
  },
  database: {
    tenantMode: "shared-schema",
  },
  nestModule: TenantSharedSchemaModule,
});
