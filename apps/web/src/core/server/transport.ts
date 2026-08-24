import "server-only";

import { serverRuntime } from "./runtime";

export const { callBackend, refreshSession } = serverRuntime;
