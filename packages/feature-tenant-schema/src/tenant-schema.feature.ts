import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { TenantSchemaModule } from "./tenant-schema.module";

/** Select schema-per-tenant isolation with validated tenant search paths. */
export const tenantSchemaFeature: FeatureManifest = defineFeature({
  id: "tenant-schema",
  capability: {
    family: "tenant-isolation",
    variant: "schema-per-tenant",
    conflictsWith: ["tenant-shared-schema"],
  },
  database: {
    tenantMode: "schema-per-tenant",
  },
  nestModule: TenantSchemaModule,
});
