import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { AuditModule } from "./audit.module";
import { auditLogs } from "./infrastructure/persistence";

export const auditFeature: FeatureManifest = defineFeature({
  id: "audit",
  dependsOn: ["upload"],
  nestModule: AuditModule,
  resourceScopes: {
    audit: "platform",
  },
  authorization: {
    resources: {
      audit: {
        scope: "organization",
        actions: ["read"], defaultGrants: { "ADMIN": ["read"] }
      },
    },
  },
  schema: { auditLogs },
});
