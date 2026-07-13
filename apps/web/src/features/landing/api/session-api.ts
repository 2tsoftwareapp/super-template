import { webFetch } from "@/lib/http";

/**
 * Session transport for the web shell. The only place the landing feature talks
 * HTTP; components call this instead of webFetch directly.
 */
export const sessionApi = {
  logout() {
    return webFetch("/api/auth/logout", { method: "POST" });
  },
};
