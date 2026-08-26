import "server-only";
import { createAuthCookieHelpers } from "@repo/web-server/auth/cookies";

import {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/core/auth/cookie-names";
import { serverConfig } from "@/core/config/server-config";

export const authRuntime = createAuthCookieHelpers({
  ...serverConfig.auth,
  cookieNames: {
    accessToken: ACCESS_TOKEN_COOKIE,
    refreshToken: REFRESH_TOKEN_COOKIE,
    csrf: CSRF_TOKEN_COOKIE,
  },
});
