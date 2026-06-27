import { configureHttpClient } from "@repo/web-core/http-config";

import { CSRF_TOKEN_COOKIE } from "@/lib/auth/cookies";

configureHttpClient({ csrfCookieName: CSRF_TOKEN_COOKIE });

export { ApiClientError, webFetch } from "@repo/web-core/http";
