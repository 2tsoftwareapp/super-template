"use client";

import type { QueryKey } from "@tanstack/react-query";

import { useQuery } from "@tanstack/react-query";

import type { SessionResponse } from "./api-types";

import { webFetch } from "./http";

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
