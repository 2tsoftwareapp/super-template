import "server-only";

import { serverRuntime } from "./internal/runtime";

export const { enforceCsrf, enforceMutationGuard } = serverRuntime;
