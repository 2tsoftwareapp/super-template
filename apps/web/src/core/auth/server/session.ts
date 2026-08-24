import "server-only";

import { authRuntime } from "./runtime";

export const { readAuthCookies, clearSessionCookies } = authRuntime;
