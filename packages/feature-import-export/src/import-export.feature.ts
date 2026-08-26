import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { ImportExportFeatureModule } from "./import-export.module";
import {
  exportJobs,
  importExportJobStatusEnum,
  importJobs,
} from "./infrastructure/persistence";

export const importExportFeature: FeatureManifest = defineFeature({
  id: "import-export",
  dependsOn: ["upload", "audit", "users", "organizations", "access-control"],
  nestModule: ImportExportFeatureModule,
  schema: { importJobs, exportJobs, importExportJobStatusEnum },
});
