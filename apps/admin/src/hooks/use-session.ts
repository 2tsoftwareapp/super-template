"use client";

import { createUseSession } from "@repo/web-hooks/use-session-factory";

import { adminSessionQueryKey } from "@/lib/query-keys";

export const sessionQueryKey = adminSessionQueryKey;

export const useSession = createUseSession({
  queryKey: sessionQueryKey,
});
