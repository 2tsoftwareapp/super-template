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
import { notificationsSeeders } from "./seed";

export const notificationsFeature: FeatureManifest = defineFeature({
  id: "notifications",
  dependsOn: ["jobs", "users", "organizations", "user-preferences"],
  nestModule: NotificationsModule,
  resourceScopes: {
    notifications: "organization",
  },
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
  seeders: notificationsSeeders,
});
