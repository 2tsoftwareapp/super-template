"use client";

import type { SessionResponse } from "@repo/web-utils/api-types";
import type { QueryKey } from "@tanstack/react-query";

import { webFetch } from "@repo/web-utils/http";
import { useQuery } from "@tanstack/react-query";

export interface CreateUseSessionOptions {
  queryKey: QueryKey;
  sessionPath?: string;
}

export function createUseSession({
  queryKey,
  sessionPath = "/api/auth/session",
}: CreateUseSessionOptions) {
  return function useSession() {
    return useQuery<SessionResponse, Error>({
      queryKey,
      queryFn: () => webFetch<SessionResponse>(sessionPath),
      retry: false,
    });
  };
}
