"use client";

import { createUseSession } from "@repo/web-hooks/use-session-factory";

export const sessionQueryKey = ["session"] as const;

export const useSession = createUseSession({
  queryKey: sessionQueryKey,
});
