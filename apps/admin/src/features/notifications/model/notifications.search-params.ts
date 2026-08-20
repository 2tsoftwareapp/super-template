import { parseSearchParams, sortOrderParam } from "@repo/web-utils/params";
import { z } from "zod";

/**
 * Pure notifications list state: URL parse/serialize.
 * Framework-free (no React / HTTP / router).
 */
export interface NotificationsSearchParams {
  sortOrder: "asc" | "desc";
}

const notificationsSearchParamsSchema = z.object({
  sortOrder: sortOrderParam("desc"),
});

const NOTIFICATIONS_SEARCH_PARAMS_FALLBACK = {
  sortOrder: "desc",
} as const;

export function parseNotificationsSearchParams(
  searchParams: URLSearchParams,
): NotificationsSearchParams {
  return parseSearchParams(notificationsSearchParamsSchema, searchParams, {
    sortOrder: NOTIFICATIONS_SEARCH_PARAMS_FALLBACK.sortOrder,
  }).data;
}

export function serializeNotificationsSearchParams(params: NotificationsSearchParams): string {
  const sp = new URLSearchParams();
  if (params.sortOrder !== "desc") sp.set("sortOrder", params.sortOrder);
  return sp.toString();
}
