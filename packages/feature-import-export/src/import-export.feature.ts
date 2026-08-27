import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { ImportExportFeatureModule } from "./import-export.module";
import { exportJobs, importExportJobStatusEnum, importJobs } from "./infrastructure/persistence";

export const importExportFeature: FeatureManifest = defineFeature({
  id: "import-export",
  dependsOn: ["upload", "users", "organizations", "access-control", "activities", "audit"],
  nestModule: ImportExportFeatureModule,
  resourceScopes: {
    imports: "organization",
    exports: "organization",
  },
  authorization: {
    resources: {
      imports: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"],
        defaultGrants: { ADMIN: ["read", "create", "update"], USER: ["read", "create", "update"] },
      },
      exports: {
        scope: "organization",
        actions: ["read", "create"],
        defaultGrants: { ADMIN: ["read", "create"], USER: ["read", "create"] },
      },
    },
  },
  schema: { importJobs, exportJobs, importExportJobStatusEnum },
});
