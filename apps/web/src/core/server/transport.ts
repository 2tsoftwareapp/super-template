import "server-only";

import { serverRuntime } from "./internal/runtime";

export const { callBackend, refreshSession } = serverRuntime;
