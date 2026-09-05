"use client";

import { adminSessionQueryKey } from "@/lib/query-keys";
import { createUseSession } from "@repo/web-hooks/use-session-factory";

export const sessionQueryKey = adminSessionQueryKey;

export const useSession = createUseSession({
  queryKey: sessionQueryKey,
});
