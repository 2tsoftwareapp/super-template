import { parseSearchParams, searchTextParam } from "@repo/web-utils/params";
import { z } from "zod";

/**
 * Pure settings list state: URL parse/serialize.
 * Framework-free (no React / HTTP / router).
 */
export interface SettingsSearchParams {
  q: string;
}

const settingsSearchParamsSchema = z.object({
  q: searchTextParam(200),
});

export function parseSettingsSearchParams(searchParams: URLSearchParams): SettingsSearchParams {
  return parseSearchParams(settingsSearchParamsSchema, searchParams, { q: "" }).data;
}

export function serializeSettingsSearchParams(params: SettingsSearchParams): URLSearchParams {
  const next = new URLSearchParams();
  if (params.q) next.set("q", params.q);
  return next;
}
