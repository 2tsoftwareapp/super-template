import "server-only";

import { serverCapabilities } from "./internal/runtime";

export const { enforceCsrf, enforceMutationGuard } = serverCapabilities.guards;
