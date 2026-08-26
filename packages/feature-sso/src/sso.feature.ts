import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  externalIdentities,
  ssoLoginStates,
  ssoSessionExchanges,
} from "./infrastructure/persistence";
import { SsoModule } from "./sso.module";

export const ssoFeature: FeatureManifest = defineFeature({
  id: "sso",
  dependsOn: ["auth", "users", "organizations", "access-control", "mfa"],
  nestModule: SsoModule,
  schema: { externalIdentities, ssoLoginStates, ssoSessionExchanges },
});
