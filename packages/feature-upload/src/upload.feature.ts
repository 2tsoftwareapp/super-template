import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  attachments,
  fileBatchOperations,
  files,
  fileVersions,
  storageDeleteOutbox,
  storageObjects,
} from "./infrastructure/persistence";
import { UploadModule } from "./upload.module";

export const uploadFeature: FeatureManifest = defineFeature({
  id: "upload",
  dependsOn: ["auth", "organizations", "users", "activities"],
  nestModule: UploadModule,
  resourceScopes: {
    files: "organization",
    attachments: "organization",
  },
  schema: {
    files,
    fileVersions,
    fileBatchOperations,
    attachments,
    storageObjects,
    storageDeleteOutbox,
  },
});
