import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { DatabaseReadReplicaModule } from "./database-read-replica.module";

/** Select eventual read routing through the configured database replica. */
export const databaseReadReplicaFeature: FeatureManifest = defineFeature({
  id: "database-read-replica",
  capability: {
    family: "database-topology",
    variant: "read-replica",
  },
  database: {
    readReplica: true,
    readConsistency: "eventual",
  },
  nestModule: DatabaseReadReplicaModule,
});
