import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { AuditModule } from "./audit.module";
import { auditLogs } from "./infrastructure/persistence";

export const auditFeature: FeatureManifest = defineFeature({
  id: "audit",
  dependsOn: [],
  nestModule: AuditModule,
  resourceScopes: {
    audit: "platform",
  },
  schema: { auditLogs },
});
