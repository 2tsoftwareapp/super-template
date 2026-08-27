import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { mailDeliveries, mailDeliveryStatusEnum } from "./infrastructure/persistence";
import { MailModule } from "./mail.module";

export const mailFeature: FeatureManifest = defineFeature({
  id: "mail",
  dependsOn: ["jobs", "user-preferences", "audit"],
  nestModule: MailModule,
  resourceScopes: {
    mail: "platform",
  },
  authorization: {
    resources: {
      mail: {
        scope: "organization",
        actions: ["read", "create"],
        defaultGrants: { ADMIN: ["read", "create"] },
      },
    },
  },
  schema: { mailDeliveries, mailDeliveryStatusEnum },
});
