import "server-only";

import { createBackendHelpers } from "@repo/web-server/server";

import { authRuntime } from "@/core/auth/server/runtime";
import { serverConfig } from "@/core/config/server-config";

const backend = createBackendHelpers({
  ...serverConfig.backend,
  auth: authRuntime,
});

export const serverCapabilities = {
  transport: {
    callBackend: backend.callBackend,
  },
  guards: {
    enforceCsrf: backend.enforceCsrf,
    enforceMutationGuard: backend.enforceMutationGuard,
  },
  proxy: {
    proxyWithRefresh: backend.proxyWithRefresh,
  },
} as const;
