import type { paths } from "./generated/index";

/** OpenAPI path keys from the generated contract (`/api/v1/...`). */
export type OpenApiPath = keyof paths;

/**
 * Map an OpenAPI path to the web/admin BFF URL.
 *
 * `/api/v1/files/{id}` + `{ id }` → `/api/bff/files/<id>`
 *
 * Source of truth is `apps/api/openapi.json` → `pnpm generate`.
 * Do not invent BFF path strings outside this helper + the contract keys.
 */
export function bffPath(
  path: OpenApiPath,
  pathParams?: Record<string, string>,
): string {
  let result: string = path.replace(/^\/api\/v1/, "/api/bff");

  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      result = result.replaceAll(`{${key}}`, encodeURIComponent(value));
    }
  }

  if (/\{[^}]+\}/.test(result)) {
    throw new Error(`Missing path params for OpenAPI path: ${path}`);
  }

  return result;
}
