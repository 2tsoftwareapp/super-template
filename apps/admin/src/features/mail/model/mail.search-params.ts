import { DEFAULT_PAGE_SIZE } from "@repo/config";
import { pageParam, parseSearchParams, searchTextParam } from "@repo/web-utils/params";
import { z } from "zod";

import { DELIVERY_STATUS_OPTIONS } from "./mail.constants";

export const DELIVERY_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export interface MailFilters {
  status: string;
  templateKey: string;
  page: number;
}

const statusValues = DELIVERY_STATUS_OPTIONS.map((option) => option.value) as [string, ...string[]];

const mailFiltersSchema = z.object({
  status: z.enum(statusValues).catch(""),
  templateKey: searchTextParam(100),
  page: pageParam,
});

const MAIL_FILTERS_FALLBACK = {
  status: "",
  templateKey: "",
  page: 1,
} as const;

export function parseMailFilters(sp: URLSearchParams): MailFilters {
  const parsed = parseSearchParams(mailFiltersSchema, sp, MAIL_FILTERS_FALLBACK);

  return {
    status: parsed.data.status,
    templateKey: parsed.data.templateKey,
    page: parsed.data.page,
  };
}

export function serializeMailFilters(filters: MailFilters): string {
  const sp = new URLSearchParams();
  if (filters.status) sp.set("status", filters.status);
  if (filters.templateKey) sp.set("templateKey", filters.templateKey);
  if (filters.page > 1) sp.set("page", String(filters.page));
  return sp.toString();
}
