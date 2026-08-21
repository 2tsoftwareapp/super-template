"use client";

import type { SortCriterion } from "@repo/api-sort";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { classifyError, getErrorMessage } from "@repo/web-utils/errors";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type {
  AuditLogsColumnFactory,
  AuditLogsViewModel,
} from "@/features/audit-logs/model/audit-logs.types";
import type { AuditLogDto } from "@/lib/api-types";

import { useResourceTableConfig } from "@/components/use-resource-table-config";
import { useExportAndDownloadAuditLogsMutation } from "@/features/audit-logs/api/audit-logs.mutations";
import { useAuditLogsQuery } from "@/features/audit-logs/api/audit-logs.queries";
import {
  type AuditLogsFilters,
  formatAuditAction,
  parseAuditLogsFilters,
  serializeAuditLogsFilters,
} from "@/features/audit-logs/model/audit-logs.search-params";
import { usePathname, useRouter } from "@/i18n/navigation";
import { createTableSortBridge } from "@/lib/table-sort";

export type { AuditLogsViewModel };

type AuditLogsSortField = "createdAt";

const auditLogsSortBridge = createTableSortBridge<AuditLogsSortField>({
  fieldByColumn: {
    createdAt: "createdAt",
  },
  columnByField: {
    createdAt: "createdAt",
  },
});

interface UseAuditLogsControllerOptions {
  createColumns: AuditLogsColumnFactory;
}

/**
 * Orchestration hook for the audit-logs screen.
 *
 * Flow:
 *   1. Parse URL filters; debounce free-text search before the list query.
 *   2. Load paginated audit entries (placeholderData keeps prior page).
 *   3. Export CSV with toast on truncate/error; classifyError for export fails.
 *   4. Detail selection is local UI state (no extra fetch).
 * Owns: URL ↔ filter sync, list query, export, detail selection.
 * Does not own: table column definitions (presentational UI).
 */
export function useAuditLogsController({
  createColumns,
}: UseAuditLogsControllerOptions): AuditLogsViewModel {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<AuditLogsFilters>(() =>
    parseAuditLogsFilters(new URLSearchParams(searchParams.toString())),
  );
  const [selectedEntry, setSelectedEntry] = useState<AuditLogDto | null>(null);

  const onFilterChange = (key: keyof AuditLogsFilters, value: string | number) => {
    const next = { ...filters, [key]: value };
    if (key !== "page") {
      next.page = 1;
    }
    setFilters(next);

    const qs = serializeAuditLogsFilters(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onClearFilters = () => {
    setFilters({ from: "", to: "", q: "", page: 1, sortOrder: "desc" });
    router.replace(pathname, { scroll: false });
  };

  const handleSortChange = (nextSort: SortCriterion<AuditLogsSortField>[]) => {
    const primary = nextSort[0] ?? { field: "createdAt" as const, order: "desc" as const };
    const next = { ...filters, sortOrder: primary.order, page: 1 };
    setFilters(next);
    const qs = serializeAuditLogsFilters(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const hasFilters = Boolean(filters.from || filters.to || filters.q);
  const q = useDebouncedValue(filters.q, 400);

  const auditLogs = useAuditLogsQuery({
    page: filters.page,
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
    q,
    sortOrder: filters.sortOrder,
  });

  const exportMutation = useExportAndDownloadAuditLogsMutation();

  const entries = auditLogs.data?.data ?? [];
  const totalPages = auditLogs.data?.meta?.totalPages ?? 1;
  const total = auditLogs.data?.meta?.total ?? 0;

  const auditLogsSort: SortCriterion<AuditLogsSortField>[] = [
    { field: "createdAt", order: filters.sortOrder },
  ];

  const { table } = useResourceTableConfig<AuditLogDto, AuditLogsSortField>({
    data: entries,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- model now any[]
    columns: createColumns({
      formatAction: formatAuditAction,
      onSelectEntry: setSelectedEntry,
    }),
    enableSelection: false,
    getRowId: (row) => row.id,
    listParams: { sort: auditLogsSort },
    sortBridge: auditLogsSortBridge,
    onSortChange: handleSortChange,
    onPageChange: (page) => onFilterChange("page", page),
  });

  function handleExport() {
    exportMutation.mutate(
      {
        from: filters.from || undefined,
        to: filters.to || undefined,
        q: q || undefined,
      },
      {
        onSuccess: ({ blob, truncated }) => {
          if (truncated) {
            toast.warning(
              "The export exceeds 5,000 rows and was truncated. Please use narrower filters.",
            );
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `audit-logs-export-${Date.now()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        },
        onError: (error) => {
          const classified = classifyError(error);
          toast.error(getErrorMessage(error, classified.message || "Failed to export audit logs."));
        },
      },
    );
  }

  return {
    filters,
    hasFilters,
    onFilterChange,
    onClearFilters,
    isLoading: auditLogs.isLoading,
    isRefreshing: auditLogs.isFetching,
    hasError: auditLogs.isError,
    onRefresh: () => void auditLogs.refetch(),
    total,
    totalPages,
    selectedEntry,
    onSelectEntry: setSelectedEntry,
    onExport: handleExport,
    isExporting: exportMutation.isPending,
    formatAction: formatAuditAction,
    table,
  };
}
