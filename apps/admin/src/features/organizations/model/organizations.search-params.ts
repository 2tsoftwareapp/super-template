import { parseSearchParams, searchTextParam } from "@repo/web-utils/params";
import { z } from "zod";

/**
 * Pure organizations list state: URL parse/serialize.
 * Framework-free (no React / HTTP / router).
 */
export interface OrganizationsSearchParams {
  q: string;
}

const organizationsSearchParamsSchema = z.object({
  q: searchTextParam(200),
});

export function parseOrganizationsSearchParams(
  searchParams: URLSearchParams,
): OrganizationsSearchParams {
  return parseSearchParams(organizationsSearchParamsSchema, searchParams, { q: "" }).data;
}

export function serializeOrganizationsSearchParams(
  params: OrganizationsSearchParams,
): URLSearchParams {
  const next = new URLSearchParams();
  if (params.q) next.set("q", params.q);
  return next;
}
