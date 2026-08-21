"use client";

import type { SortCriterion } from "@repo/api-sort";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import type { FilesFilters } from "@/features/files/model/files.search-params";
import type { FilesSortCriterion } from "@/features/files/model/files.types";

import {
  parseFilesFilters,
  serializeFilesFilters,
} from "@/features/files/model/files.search-params";
import { usePathname, useRouter } from "@/i18n/navigation";

type FilesSortField = FilesSortCriterion["field"];

interface UseFilesUrlStateReturn {
  filters: FilesFilters;
  debouncedSearch: string;
  hasFilters: boolean;
  onFilterChange: (key: keyof FilesFilters, value: string | number) => void;
  onClearFilters: () => void;
  handleSortChange: (nextSort: SortCriterion<FilesSortField>[]) => void;
}

/**
 * URL ↔ filter state for the files list. Extracted from
 * useFilesController so the orchestrator stays under the size budget.
 *
 * Flow:
 *   1. Parse URL filters (q/mime/page/sort) into local state.
 *   2. Filter changes reset page (except pagination itself) and sync to URL.
 *   3. Search is debounced before reaching the list query.
 */
export function useFilesUrlState(): UseFilesUrlStateReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilesFilters>(() =>
    parseFilesFilters(new URLSearchParams(searchParams.toString())),
  );

  const applyFilters = useCallback(
    (next: FilesFilters) => {
      setFilters(next);
      const qs = serializeFilesFilters(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const onFilterChange = useCallback(
    (key: keyof FilesFilters, value: string | number) => {
      const next = { ...filters, [key]: value };
      if (key !== "page") {
        next.page = 1;
      }
      applyFilters(next);
    },
    [applyFilters, filters],
  );

  const onClearFilters = useCallback(() => {
    setFilters({ q: "", mime: "", page: 1, sortField: "createdAt", sortOrder: "desc" });
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const handleSortChange = useCallback(
    (nextSort: SortCriterion<FilesSortField>[]) => {
      const primary = nextSort[0] ?? { field: "createdAt" as const, order: "desc" as const };
      applyFilters({ ...filters, sortField: primary.field, sortOrder: primary.order, page: 1 });
    },
    [applyFilters, filters],
  );

  const hasFilters = Boolean(filters.q || filters.mime);
  const debouncedSearch = useDebouncedValue(filters.q, 400);

  return { filters, debouncedSearch, hasFilters, onFilterChange, onClearFilters, handleSortChange };
}
