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
  dependsOn: ["activities"],
  nestModule: JobsModule,
  authorization: {
    resources: {
      jobs: {
        scope: "organization",
        actions: ["read", "update", "delete"],
        defaultGrants: { ADMIN: ["read", "update", "delete"] },
      },
    },
  },
  schema: { jobs, jobAttempts, jobDependencies, jobEvents, jobStatusEnum },
});
