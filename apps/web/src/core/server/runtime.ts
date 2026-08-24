import "server-only";

import { createBackendHelpers } from "@repo/web-server/server";

import { authRuntime } from "@/core/auth/runtime";
import { serverEnv } from "@/core/config/server-env";

export const serverRuntime = createBackendHelpers({
  apiInternalUrl: serverEnv.API_INTERNAL_URL,
  allowedOrigins: serverEnv.WEB_ORIGIN.split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  auth: authRuntime,
});
