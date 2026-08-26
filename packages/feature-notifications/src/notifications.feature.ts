import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  notificationAudienceEnum,
  notificationDeliveries,
  notificationDeliveryStatusEnum,
  notificationDevicePlatformEnum,
  notificationDeviceTokens,
  notificationJobs,
  notificationJobStatusEnum,
  notifications,
} from "./infrastructure/persistence";
import { NotificationsModule } from "./notifications.module";

export const notificationsFeature: FeatureManifest = defineFeature({
  id: "notifications",
  dependsOn: ["jobs"],
  nestModule: NotificationsModule,
  schema: {
    notifications,
    notificationDeviceTokens,
    notificationJobs,
    notificationDeliveries,
    notificationAudienceEnum,
    notificationDeliveryStatusEnum,
    notificationDevicePlatformEnum,
    notificationJobStatusEnum,
  },
});
