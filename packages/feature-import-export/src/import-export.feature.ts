import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { ImportExportFeatureModule } from "./import-export.module";
import {
  exportJobs,
  importExportJobStatusEnum,
  importJobs,
} from "./infrastructure/persistence";

export const importExportFeature: FeatureManifest = defineFeature({
  id: "import-export",
  dependsOn: ["upload", "users", "organizations", "access-control", "activities"],
  nestModule: ImportExportFeatureModule,
  resourceScopes: {
    imports: "organization",
    exports: "organization",
  },
  schema: { importJobs, exportJobs, importExportJobStatusEnum },
});
