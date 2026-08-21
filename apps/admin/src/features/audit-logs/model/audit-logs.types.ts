
import type { AuditLogDto } from "@/lib/api-types";

import type { AuditLogsFilters } from "./audit-logs.search-params";

export interface AuditLogsColumnOptions {
  formatAction: (action: string) => string;
  onSelectEntry: (entry: AuditLogDto) => void;
}

export type AuditLogsColumnFactory = (
  options: AuditLogsColumnOptions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- column defs are opaque in model
) => any[];

/**
 * Presentational view-model for the audit-logs screen.
 * Lives in model so UI can import the type without depending on controllers.
 */
export interface AuditLogsViewModel {
  filters: AuditLogsFilters;
  hasFilters: boolean;
  onFilterChange: (key: keyof AuditLogsFilters, value: string | number) => void;
  onClearFilters: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  onRefresh: () => void;
  total: number;
  totalPages: number;
  selectedEntry: AuditLogDto | null;
  onSelectEntry: (entry: AuditLogDto | null) => void;
  onExport: () => void;
  isExporting: boolean;
  formatAction: (action: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table is opaque in model
  table: any;
}
