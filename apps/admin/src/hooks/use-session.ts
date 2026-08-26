"use client";

import { adminSessionQueryKey } from "@repo/web-hooks/admin-session-query-key";
import { createUseSession } from "@repo/web-hooks/use-session-factory";

export const sessionQueryKey = adminSessionQueryKey;

export const useSession = createUseSession({
  queryKey: sessionQueryKey,
});
