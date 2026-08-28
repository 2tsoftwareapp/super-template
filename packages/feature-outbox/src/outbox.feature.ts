import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { outboxMessages } from "./infrastructure/persistence/outbox-messages";
import { OutboxModule } from "./outbox.module";

export const outboxFeature: FeatureManifest = defineFeature({
  id: "outbox",
  dependsOn: [],
  provides: ["outbox"],
  nestModule: OutboxModule,
  resourceScopes: {},
  schema: { outboxMessages },
  outboxHandlers: [],
});
