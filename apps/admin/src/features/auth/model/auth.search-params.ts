import { parseSearchParams, searchTextParam } from "@repo/web-utils/params";
import { z } from "zod";

import { AUTH_ERROR_QUERY_VALUES } from "./auth.constants";

const authLoginSearchSchema = z.object({
  error: z.enum([AUTH_ERROR_QUERY_VALUES.ssoFailed]).optional(),
});

const AUTH_LOGIN_SEARCH_FALLBACK = {
  error: undefined,
} as const;

const ssoCallbackSearchSchema = z.object({
  error: z.enum([AUTH_ERROR_QUERY_VALUES.ssoFailed]).optional(),
  // Opaque one-time exchange code — bound length; empty means missing.
  exchange: searchTextParam(512),
});

const SSO_CALLBACK_SEARCH_FALLBACK = {
  error: undefined,
  exchange: "",
} as const;

export interface AuthLoginSearchParams {
  error: typeof AUTH_ERROR_QUERY_VALUES.ssoFailed | undefined;
}

export interface SsoCallbackSearchParams {
  error: typeof AUTH_ERROR_QUERY_VALUES.ssoFailed | undefined;
  exchange: string;
}

/** Parse presentation params on `/login` (SSO error flag). */
export function parseAuthLoginSearchParams(sp: URLSearchParams): AuthLoginSearchParams {
  const parsed = parseSearchParams(authLoginSearchSchema, sp, AUTH_LOGIN_SEARCH_FALLBACK);
  return { error: parsed.data.error };
}

/** Parse presentation params on `/login/sso/callback`. */
export function parseSsoCallbackSearchParams(sp: URLSearchParams): SsoCallbackSearchParams {
  const parsed = parseSearchParams(ssoCallbackSearchSchema, sp, SSO_CALLBACK_SEARCH_FALLBACK);
  return {
    error: parsed.data.error,
    exchange: parsed.data.exchange,
  };
}
