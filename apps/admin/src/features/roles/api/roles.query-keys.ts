/**
 * Re-export of the shared key factory in `lib/query-keys` so feature-internal
 * imports keep working. The factory itself lives in `lib/` because the
 * cross-feature lookup hook in `src/hooks/` must share the same cache keys.
 */
export { rolesKeys } from "@/lib/query-keys";
