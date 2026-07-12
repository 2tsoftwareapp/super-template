import { Button } from "@repo/web-core/components/button";
import { LoadingButton } from "@repo/web-core/components/loading-button";
import { RefreshCw, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

const mimeOptions = [
  { value: "", label: "All types" },
  { value: "image/", label: "Image" },
  { value: "video/", label: "Video" },
  { value: "audio/", label: "Audio" },
  { value: "application/pdf", label: "PDF" },
  { value: "text/", label: "Text" },
] as const;

interface FilesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  mimeFilter: string;
  onMimeFilterChange: (value: string) => void;
  isFetching: boolean;
  onRefresh: () => void;
  isUploadPending: boolean;
  onUploadClick: () => void;
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
  isFetching,
  onRefresh,
  isUploadPending,
  onUploadClick,
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
              <option key={opt.value} value={opt.value}>
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
        <LoadingButton
          size="sm"
          onClick={onUploadClick}
          loading={isUploadPending}
        >
          <Upload data-icon="inline-start" />
          Upload
        </LoadingButton>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCw
            data-icon="inline-start"
            className={cn(isFetching && "animate-spin")}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}
