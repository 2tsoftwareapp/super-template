import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  jobAttempts,
  jobDependencies,
  jobEvents,
  jobs,
  jobStatusEnum,
} from "./infrastructure/persistence";
import { JobsModule } from "./jobs.module";

export const jobsFeature: FeatureManifest = defineFeature({
  id: "jobs",
  dependsOn: ["activities", "users"],
  nestModule: JobsModule,
  resourceScopes: {
    jobs: "platform",
  },
  schema: { jobs, jobAttempts, jobDependencies, jobEvents, jobStatusEnum },
});
