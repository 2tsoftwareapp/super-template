import "server-only";

import { serverCapabilities } from "./internal/runtime";

export const { callBackend } = serverCapabilities.transport;
