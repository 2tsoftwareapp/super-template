import { parseSearchParams, searchTextParam } from "@repo/web-utils/params";
import { z } from "zod";

const verifyEmailSearchSchema = z.object({
  token: searchTextParam(512),
});

const VERIFY_EMAIL_SEARCH_FALLBACK = {
  token: "",
} as const;

export interface VerifyEmailSearchParams {
  token: string;
}

export function parseVerifyEmailSearchParams(sp: URLSearchParams): VerifyEmailSearchParams {
  const parsed = parseSearchParams(verifyEmailSearchSchema, sp, VERIFY_EMAIL_SEARCH_FALLBACK);
  return { token: parsed.data.token };
}
