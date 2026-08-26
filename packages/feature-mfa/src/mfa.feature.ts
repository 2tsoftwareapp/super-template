import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  mfaChallenges,
  userRecoveryCodes,
  userTwoFactorSecrets,
} from "./infrastructure/persistence";
import { MfaModule } from "./mfa.module";

export const mfaFeature: FeatureManifest = defineFeature({
  id: "mfa",
  dependsOn: ["users", "audit"],
  nestModule: MfaModule,
  schema: { userTwoFactorSecrets, userRecoveryCodes, mfaChallenges },
});
