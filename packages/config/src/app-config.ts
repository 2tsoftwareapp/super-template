import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "./pagination";

/**
 * Non-API application config shared across all runtimes (NestJS API, web/admin
 * BFFs, Flutter app). API-shaped config — DTOs, endpoints, status enums — is
 * NOT here; it belongs to the generated OpenAPI contract (@repo/api-contract).
 *
 * This object is the single source of truth. `pnpm --filter @repo/config generate`
 * serializes it to `generated/config.json` and a Dart artifact for the app.
 */
export interface SharedConfig {
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
    pageSizeOptions: readonly number[];
  };
}

export const appConfig = {
  pagination: {
    defaultPageSize: DEFAULT_PAGE_SIZE,
    maxPageSize: MAX_PAGE_SIZE,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
  },
} satisfies SharedConfig;
