import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { mailDeliveries, mailDeliveryStatusEnum } from "./infrastructure/persistence";
import { MailModule } from "./mail.module";

export const mailFeature: FeatureManifest = defineFeature({
  id: "mail",
  dependsOn: ["jobs"],
  nestModule: MailModule,
  schema: { mailDeliveries, mailDeliveryStatusEnum },
});
