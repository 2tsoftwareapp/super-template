import { createBackendHelpers } from "@repo/web-server/server";

import { authRuntime } from "@/core/auth/runtime";
import { env } from "@/core/config/env";

const backend = createBackendHelpers({
  apiInternalUrl: env.API_INTERNAL_URL,
  allowedOrigins: env.WEB_ORIGIN.split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  auth: authRuntime,
});

export const {
  callBackend,
  refreshSession,
  enforceOrigin,
  enforceCsrf,
  enforceMutationGuard,
  proxyWithRefresh,
} = backend;
