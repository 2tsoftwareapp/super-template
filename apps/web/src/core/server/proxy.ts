import "server-only";

import { serverCapabilities } from "./internal/runtime";

export const { proxyWithRefresh } = serverCapabilities.proxy;
