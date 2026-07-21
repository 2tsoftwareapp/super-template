"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { AuditLogDto } from "@/lib/api-types";

import {
  exportAuditLogs,
  downloadAuditLogExport,
} from "@/features/audit-logs/api/audit-logs.api";
import { useAuditLogsQuery } from "@/features/audit-logs/api/audit-logs.queries";
import {
  type AuditLogsFilters,
  parseAuditLogsFilters,
  serializeAuditLogsFilters,
} from "@/features/audit-logs/model/audit-logs.filters";
import { usePathname, useRouter } from "@/i18n/navigation";

export interface AuditLogsViewModel {
  filters: AuditLogsFilters;
  hasFilters: boolean;
  onFilterChange: (key: keyof AuditLogsFilters, value: string | number) => void;
  onClearFilters: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  onRefresh: () => void;
  entries: AuditLogDto[];
  total: number;
  totalPages: number;
  selectedEntry: AuditLogDto | null;
  onSelectEntry: (entry: AuditLogDto | null) => void;
  onExport: () => void;
  isExporting: boolean;
}

/**
 * Orchestration hook for the audit-logs screen: URL-backed filter state,
 * debounced search, the audit query, and detail-drawer selection. Returns a
 * view model consumed by the presentational AuditLogsListView.
 */
export function useAuditLogsController(): AuditLogsViewModel {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<AuditLogsFilters>(() =>
    parseAuditLogsFilters(new URLSearchParams(searchParams.toString())),
  );
  const [selectedEntry, setSelectedEntry] = useState<AuditLogDto | null>(null);

  const onFilterChange = (
    key: keyof AuditLogsFilters,
    value: string | number,
  ) => {
    const next = { ...filters, [key]: value };
    if (key !== "page") {
      next.page = 1;
    }
    setFilters(next);

    const qs = serializeAuditLogsFilters(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onClearFilters = () => {
    setFilters({ from: "", to: "", q: "", page: 1 });
    router.replace(pathname, { scroll: false });
  };

  const hasFilters = Boolean(filters.from || filters.to || filters.q);
  const q = useDebouncedValue(filters.q, 400);

  const auditLogs = useAuditLogsQuery({
    page: filters.page,
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
    q,
  });

  const [isExporting, setIsExporting] = useState(false);

  const onExport = async () => {
    setIsExporting(true);
    try {
      const { data } = await exportAuditLogs({
        from: filters.from || undefined,
        to: filters.to || undefined,
        q: q || undefined,
      });

      if (data.truncated) {
        toast.warning(
          "The export exceeds 5,000 rows and was truncated. Please use narrower filters."
        );
      }

      const blob = await downloadAuditLogExport(data.fileId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export errors are silently handled; the button state resets.
    } finally {
      setIsExporting(false);
    }
  };

  return {
    filters,
    hasFilters,
    onFilterChange,
    onClearFilters,
    isLoading: auditLogs.isLoading,
    isRefreshing: auditLogs.isFetching,
    hasError: auditLogs.isError,
    onRefresh: () => void auditLogs.refetch(),
    entries: auditLogs.data?.data ?? [],
    total: auditLogs.data?.meta?.total ?? 0,
    totalPages: auditLogs.data?.meta?.totalPages ?? 1,
    selectedEntry,
    onSelectEntry: setSelectedEntry,
    onExport,
    isExporting,
  };
}
