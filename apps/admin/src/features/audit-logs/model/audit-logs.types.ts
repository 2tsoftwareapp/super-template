import type { AuditLogDto } from "@/lib/api-types";

import type { AuditLogsFilters } from "./audit-logs.search-params";

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
  entries: AuditLogDto[];
  total: number;
  totalPages: number;
  selectedEntry: AuditLogDto | null;
  onSelectEntry: (entry: AuditLogDto | null) => void;
  onExport: () => void;
  isExporting: boolean;
  formatAction: (action: string) => string;
}
