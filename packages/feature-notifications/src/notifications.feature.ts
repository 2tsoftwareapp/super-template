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
  dependsOn: ["jobs", "users", "organizations", "user-preferences", "audit"],
  nestModule: NotificationsModule,
  resourceScopes: {
    notifications: "organization",
  },
  authorization: {
    resources: {
      notifications: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"], defaultGrants: { "ADMIN": ["read", "create", "delete"], "USER": ["read"] }
      },
    },
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
