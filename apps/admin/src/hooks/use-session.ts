"use client";

import { createUseSession } from "@repo/web-hooks/use-session-factory";

export const sessionQueryKey = ["admin-session"] as const;

export const useSession = createUseSession({
  queryKey: sessionQueryKey,
});
