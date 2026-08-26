import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { ActivitiesModule } from "./activities.module";
import { activities, activityVisibilityEnum } from "./infrastructure/persistence";

export const activitiesFeature: FeatureManifest = defineFeature({
  id: "activities",
  dependsOn: [],
  nestModule: ActivitiesModule,
  resourceScopes: {
    activities: "organization",
  },
  schema: { activities, activityVisibilityEnum },
});
