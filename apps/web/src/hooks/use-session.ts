"use client";

import { createUseSession } from "@repo/web-core/session";

export const sessionQueryKey = ["session"] as const;

export const useSession = createUseSession({
  queryKey: sessionQueryKey,
});
