import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  externalIdentities,
  ssoLoginStates,
  ssoSessionExchanges,
} from "./infrastructure/persistence";
import { SsoModule } from "./sso.module";

export const ssoFeature: FeatureManifest = defineFeature({
  id: "sso",
  dependsOn: ["auth", "users", "organization-management", "access-control", "mfa", "audit"],
  nestModule: SsoModule,
  schema: { externalIdentities, ssoLoginStates, ssoSessionExchanges },
});
