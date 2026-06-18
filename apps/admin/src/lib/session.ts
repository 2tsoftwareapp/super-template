import { useQuery } from "@tanstack/react-query";

import type { SessionResponse } from "./types";

import { webFetch } from "./http";

export const sessionQueryKey = ["admin-session"];

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => webFetch<SessionResponse>("/api/v1/auth/me"),
    retry: false,
  });
}
