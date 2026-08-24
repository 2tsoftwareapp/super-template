import { configureHttpClient } from "@repo/web-utils/http-config";

import { CSRF_TOKEN_COOKIE } from "@/lib/auth/cookie-names";

configureHttpClient({ csrfCookieName: CSRF_TOKEN_COOKIE });

export { ApiClientError, webFetch } from "@repo/web-utils/http";
