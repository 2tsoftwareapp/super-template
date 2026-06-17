"use client";

import { useQuery } from "@tanstack/react-query";

import type { AuthSessionResponse } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export const sessionQueryKey = ["session"];

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => webFetch<AuthSessionResponse>("/api/auth/session"),
    retry: false,
  });
}
