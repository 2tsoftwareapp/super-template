import { DEFAULT_PAGE_SIZE } from "@repo/config";
import {
  enumParam,
  pageParam,
  parseSearchParams,
  searchTextParam,
} from "@repo/web-utils/params";
import { z } from "zod";

export const DELIVERY_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export interface Filters {
  status: string;
  templateKey: string;
  page: number;
}

const mailFiltersSchema = z.object({
  status: searchTextParam(50),
  templateKey: searchTextParam(100),
  page: pageParam,
});

const MAIL_FILTERS_FALLBACK = {
  status: "",
  templateKey: "",
  page: 1,
} as const;

export function parseFilters(sp: URLSearchParams): Filters {
  const parsed = parseSearchParams(mailFiltersSchema, sp, MAIL_FILTERS_FALLBACK);
  return {
    status: parsed.data.status,
    templateKey: parsed.data.templateKey,
    page: parsed.data.page,
  };
}

export function mailStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "SENT")
    return {
      variant: "default",
      className: "bg-primary/15 text-primary border-primary/30",
    };
  if (status === "FAILED")
    return {
      variant: "outline",
      className: "text-destructive border-destructive/40",
    };
  return { variant: "secondary" };
}
