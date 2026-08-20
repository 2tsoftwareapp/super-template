import {
  enumParam,
  pageParam,
  parseSearchParams,
  searchTextParam,
  sortOrderParam,
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
  sortField: "createdAt" | "originalName" | "sizeBytes";
  sortOrder: "asc" | "desc";
}

const mimeValues = FILE_MIME_OPTIONS.map((option) => option.value) as [string, ...string[]];

const SORT_FIELDS = ["createdAt", "originalName", "sizeBytes"] as const;

const filesFiltersSchema = z.object({
  q: searchTextParam(200),
  mime: z.enum(mimeValues).catch(""),
  page: pageParam,
  sortField: enumParam([...SORT_FIELDS], "createdAt"),
  sortOrder: sortOrderParam("desc"),
});

const FILES_FILTERS_FALLBACK = {
  q: "",
  mime: "",
  page: 1,
  sortField: "createdAt",
  sortOrder: "desc",
} as const;

export function parseFilesFilters(sp: URLSearchParams): FilesFilters {
  const parsed = parseSearchParams(filesFiltersSchema, sp, FILES_FILTERS_FALLBACK);

  return {
    q: parsed.data.q,
    mime: parsed.data.mime,
    page: parsed.data.page,
    sortField: parsed.data.sortField,
    sortOrder: parsed.data.sortOrder,
  };
}

export function serializeFilesFilters(filters: FilesFilters): string {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.mime) sp.set("mime", filters.mime);
  if (filters.page > 1) sp.set("page", String(filters.page));
  if (filters.sortField !== "createdAt") sp.set("sortField", filters.sortField);
  if (filters.sortOrder !== "desc") sp.set("sortOrder", filters.sortOrder);
  return sp.toString();
}
