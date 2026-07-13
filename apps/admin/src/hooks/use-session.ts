"use client";

import { createUseSession } from "@repo/web-utils/session";

export const sessionQueryKey = ["admin-session"] as const;

export const useSession = createUseSession({
  queryKey: sessionQueryKey,
});
