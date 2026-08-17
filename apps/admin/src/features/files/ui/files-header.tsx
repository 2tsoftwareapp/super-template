import { Button } from "@repo/web-ui/button";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { RefreshCw, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

interface MimeOption {
  value: string;
  label: string;
}

interface FilesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  mimeFilter: string;
  onMimeFilterChange: (value: string) => void;
  mimeOptions: readonly MimeOption[];
  isFetching: boolean;
  onRefresh: () => void;
  isUploadPending: boolean;
  onUploadClick: () => void;
  canUpload: boolean;
  resultLabel: string;
  searchPlaceholder?: string;
}

export function FilesHeader({
  search,
  onSearchChange,
  hasFilters,
  onClearFilters,
  mimeFilter,
  onMimeFilterChange,
  mimeOptions,
  isFetching,
  onRefresh,
  isUploadPending,
  onUploadClick,
  canUpload,
  resultLabel,
  searchPlaceholder = "Search by file name",
}: FilesHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-base font-semibold">Files</h1>
          <p className="truncate text-xs text-muted-foreground">{resultLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex h-9 w-[200px] rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <select
            value={mimeFilter}
            onChange={(e) => onMimeFilterChange(e.target.value)}
            className="flex h-9 w-[140px] rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {mimeOptions.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear
            </Button>
          )}
        </div>
        {canUpload ? (
          <LoadingButton size="sm" onClick={onUploadClick} loading={isUploadPending}>
            <Upload data-icon="inline-start" />
            Upload
          </LoadingButton>
        ) : null}
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
          <RefreshCw data-icon="inline-start" className={cn(isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </div>
  );
}
