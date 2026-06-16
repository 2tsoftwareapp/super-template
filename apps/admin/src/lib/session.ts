import { useQuery } from "@tanstack/react-query";
import type { SessionResponse } from "./types";
import { webFetch } from "./http";
import { getStoredAuthTokens } from "./auth";

export const sessionQueryKey = ["admin-session"];

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => {
      if (!getStoredAuthTokens()?.accessToken) {
        throw new Error("Missing admin session");
      }

      return webFetch<SessionResponse>("/api/v1/auth/me");
    },
    retry: false,
  });
}
