import {
  pageParam,
  parseSearchParams,
  searchTextParam,
} from "@repo/web-utils/params";
import { z } from "zod";

import { STATUS_OPTIONS } from "./jobs.constants";

export interface JobsFilters {
  status: string;
  type: string;
  page: number;
}

const statusValues = STATUS_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

const jobsFiltersSchema = z.object({
  status: z.enum(statusValues).catch(""),
  type: searchTextParam(100),
  page: pageParam,
});

const JOBS_FILTERS_FALLBACK = {
  status: "",
  type: "",
  page: 1,
} as const;

export function parseJobsFilters(sp: URLSearchParams): JobsFilters {
  const parsed = parseSearchParams(
    jobsFiltersSchema,
    sp,
    JOBS_FILTERS_FALLBACK,
  );

  return {
    status: parsed.data.status,
    type: parsed.data.type,
    page: parsed.data.page,
  };
}

export function serializeJobsFilters(filters: JobsFilters): string {
  const sp = new URLSearchParams();
  if (filters.status) sp.set("status", filters.status);
  if (filters.type) sp.set("type", filters.type);
  if (filters.page > 1) sp.set("page", String(filters.page));
  return sp.toString();
}
