import "server-only";
import { createBackendHelpers } from "@repo/web-server/server";

import { authRuntime } from "@/core/auth/server/runtime";
import { serverConfig } from "@/core/config/server-config";

export const serverRuntime = createBackendHelpers({
  ...serverConfig.backend,
  auth: authRuntime,
});
