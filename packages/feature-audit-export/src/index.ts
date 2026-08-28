import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { AuditExportModule } from "./audit-export.module";

export const auditExportFeature: FeatureManifest = defineFeature({
  id: "audit-export",
  dependsOn: ["audit", "upload", "access-control"],
  provides: ["audit-export"],
  nestModule: AuditExportModule,
});
