import {
  pageParam,
  parseSearchParams,
  searchTextParam,
} from "@repo/web-utils/params";
import { z } from "zod";

import { FILE_MIME_OPTIONS } from "./files.constants";

/**
 * Pure files list state: filter shape + URL parse/serialize.
 * Framework-free (no React / HTTP / router).
 */
export interface FilesFilters {
  q: string;
  mime: string;
  page: number;
}

const mimeValues = FILE_MIME_OPTIONS.map((option) => option.value) as [
  string,
  ...string[],
];

const filesFiltersSchema = z.object({
  q: searchTextParam(200),
  mime: z.enum(mimeValues).catch(""),
  page: pageParam,
});

const FILES_FILTERS_FALLBACK = {
  q: "",
  mime: "",
  page: 1,
} as const;

export function parseFilesFilters(sp: URLSearchParams): FilesFilters {
  const parsed = parseSearchParams(
    filesFiltersSchema,
    sp,
    FILES_FILTERS_FALLBACK,
  );

  return {
    q: parsed.data.q,
    mime: parsed.data.mime,
    page: parsed.data.page,
  };
}

export function serializeFilesFilters(filters: FilesFilters): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.mime) sp.set("mime", filters.mime);
  if (filters.page > 1) sp.set("page", String(filters.page));
  return sp.toString();
}
