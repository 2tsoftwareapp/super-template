import type { SortCriterion } from "@repo/api-sort";
import type { ColumnDef, Table as ReactTable } from "@tanstack/react-table";

import type { FileDto, FileHistoryEventDto, FileVersionDto } from "@/lib/api-types";

import type { FILE_MIME_OPTIONS } from "./files.constants";

export type FilesSortField = "createdAt" | "originalName" | "sizeBytes";

export type FilesSortCriterion = SortCriterion<FilesSortField>;

export interface FilesColumnOptions {
  canDelete: boolean;
  formatBytes: (bytes: number) => string;
  formatMimeType: (mime: string) => string;
  onDeleteClick: (file: FileDto) => void;
}

export type FilesColumnFactory = (
  options: FilesColumnOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- column defs are opaque in model
) => ColumnDef<FileDto, any>[];

export interface FilesViewModel {
  header: {
    isFetching: boolean;
    total: number;
    onRefresh: () => void;
  };
  toolbar: {
    search: string;
    onSearchChange: (value: string) => void;
    hasFilters: boolean;
    onClearFilters: () => void;
    mimeFilter: string;
    onMimeFilterChange: (value: string) => void;
    mimeOptions: typeof FILE_MIME_OPTIONS;
    canUpload: boolean;
  };
  list: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    files: FileDto[];
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
    resultLabel: string;
    onRowClick: (file: FileDto) => void;
    hasFilters: boolean;
    formatBytes: (bytes: number) => string;
    formatMimeType: (mime: string) => string;
  };
  upload: {
    isPending: boolean;
    onUpload: (file: File) => void;
  };
  detail: {
    file: FileDto | null;
    description: string;
    onClose: () => void;
    onDownload: () => void;
    onDelete: () => void;
    canDelete: boolean;
    isDownloading: boolean;
  };
  versions: {
    data: FileVersionDto[] | undefined;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
  };
  history: {
    data: FileHistoryEventDto[] | undefined;
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
  };
  detailTabs: {
    activeTab: "versions" | "history";
    onTabChange: (tab: "versions" | "history") => void;
    uploadVersion: {
      isPending: boolean;
      onUpload: (file: File) => void;
      canUpload: boolean;
    };
  };
  confirmDelete: {
    target: FileDto | null;
    isPending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
  };
  table: ReactTable<FileDto>;
}
