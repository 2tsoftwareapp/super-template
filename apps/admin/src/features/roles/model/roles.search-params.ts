import { pageParam, parseSearchParams, searchTextParam, uuidParam } from "@repo/web-utils/params";
import { z } from "zod";

const scopeParam = z.enum(["platform", "organization"]).optional();

const rolesSearchParamsSchema = z.object({
  page: pageParam,
  search: searchTextParam(200),
  scope: scopeParam,
  organizationId: uuidParam.optional(),
});

export type RolesSearchParams = z.infer<typeof rolesSearchParamsSchema>;

const ROLES_SEARCH_PARAMS_FALLBACK: RolesSearchParams = {
  page: 1,
  search: "",
  scope: undefined,
  organizationId: undefined,
};

/**
 * Parse the roles list search params with per-key recovery: a malformed key
 * falls back instead of blanking the whole list (CODING_RULES §15 R4).
 */
export function parseRolesSearchParams(searchParams: URLSearchParams): RolesSearchParams {
  return parseSearchParams(rolesSearchParamsSchema, searchParams, ROLES_SEARCH_PARAMS_FALLBACK)
    .data;
}
