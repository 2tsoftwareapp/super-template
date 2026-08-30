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
  dependsOn: ["auth", "organizations", "users", "activities", "audit", "access-control"],
  nestModule: UploadModule,
  authorization: {
    resources: {
      files: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"],
        defaultGrants: { ADMIN: ["*"], USER: ["*"] },
      },
      attachments: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"],
        defaultGrants: { ADMIN: ["*"], USER: ["*"] },
      },
    },
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
