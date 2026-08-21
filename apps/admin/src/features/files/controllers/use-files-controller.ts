"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type {
  FilesColumnFactory,
  FilesSortCriterion,
  FilesViewModel,
} from "@/features/files/model/files.types";
import type { FileDto } from "@/lib/api-types";

import { useResourceTableConfig } from "@/components/use-resource-table-config";
import {
  useFileHistoryQuery,
  useFilesQuery,
  useFileVersionsQuery,
} from "@/features/files/api/files.queries";
import { filesKeys } from "@/features/files/api/files.query-keys";
import { formatBytes, formatMimeType } from "@/features/files/model/files-formatting";
import { FILE_MIME_OPTIONS } from "@/features/files/model/files.constants";
import { selectFilePermissions } from "@/features/files/model/files.permissions";
import { useSession } from "@/hooks/use-session";
import { createTableSortBridge } from "@/lib/table-sort";

import { useFilesMutations } from "./use-files-mutations";
import { useFilesUrlState } from "./use-files-url-state";

export type { FilesViewModel };

type FilesSortField = FilesSortCriterion["field"];

const filesSortBridge = createTableSortBridge<FilesSortField>({
  fieldByColumn: {
    originalName: "originalName",
    sizeBytes: "sizeBytes",
    createdAt: "createdAt",
  },
  columnByField: {
    originalName: "originalName",
    sizeBytes: "sizeBytes",
    createdAt: "createdAt",
  },
});

interface UseFilesControllerOptions {
  createColumns: FilesColumnFactory;
}

/**
 * Orchestration hook for the files screen.
 *
 * Flow:
 *   1. Parse URL filters (q/mime/page) into local state.
 *   2. Debounce search → list query with placeholderData.
 *   3. Detail drawer loads versions/history for the selected file.
 *   4. Upload / version / delete invalidate `filesKeys.all`.
 *   5. Download resolves a signed URL via mutation (toast on failure).
 * Owns: URL filters, list/upload/delete orchestration, selection.
 * Does not own: table column atoms or drawer markup.
 */
export function useFilesController({ createColumns }: UseFilesControllerOptions): FilesViewModel {
  const queryClient = useQueryClient();
  const session = useSession();
  const permissions = selectFilePermissions(session.data?.data.permissions);

  const { filters, debouncedSearch, hasFilters, onFilterChange, onClearFilters, handleSortChange } =
    useFilesUrlState();

  const [selectedFile, setSelectedFile] = useState<FileDto | null>(null);
  const [detailTab, setDetailTab] = useState<"versions" | "history">("versions");

  const files = useFilesQuery({
    search: debouncedSearch,
    mimeFilter: filters.mime || undefined,
    page: filters.page,
    sortField: filters.sortField,
    sortOrder: filters.sortOrder,
  });

  const versions = useFileVersionsQuery(selectedFile?.id);
  const history = useFileHistoryQuery(selectedFile?.id);

  const {
    deleteFile,
    uploadFile,
    uploadVersion,
    downloadUrl,
    handleDownload,
    handleUpload,
    handleUploadVersion,
    handleConfirmDelete,
    deleteTarget,
    setDeleteTarget,
  } = useFilesMutations({ selectedFile, setSelectedFile });

  const entries = files.data?.data ?? [];
  const totalPages = files.data?.meta?.totalPages ?? 1;
  const total = files.data?.meta?.total ?? 0;

  const filesSort: FilesSortCriterion[] = [{ field: filters.sortField, order: filters.sortOrder }];

  const { table } = useResourceTableConfig<FileDto, FilesSortField>({
    data: entries,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- model now any[]
    columns: createColumns({
      canDelete: permissions.canDelete,
      formatBytes,
      formatMimeType,
      onDeleteClick: (file) => setDeleteTarget(file),
    }),
    enableSelection: false,
    getRowId: (row) => row.id,
    listParams: { sort: filesSort },
    sortBridge: filesSortBridge,
    onSortChange: handleSortChange,
    onPageChange: (page) => onFilterChange("page", page),
  });

  const retryList = () => {
    void queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
  };
  const retryVersions = () => {
    if (!selectedFile) return;
    void queryClient.invalidateQueries({
      queryKey: filesKeys.versions(selectedFile.id),
    });
  };
  const retryHistory = () => {
    if (!selectedFile) return;
    void queryClient.invalidateQueries({
      queryKey: filesKeys.history(selectedFile.id),
    });
  };

  const handleRowClick = (file: FileDto) => {
    setSelectedFile(file);
    setDetailTab("versions");
  };

  return {
    header: {
      isFetching: files.isFetching,
      total,
      onRefresh: retryList,
    },
    toolbar: {
      search: filters.q,
      onSearchChange: (value) => onFilterChange("q", value),
      hasFilters,
      onClearFilters,
      mimeFilter: filters.mime,
      onMimeFilterChange: (value) => onFilterChange("mime", value),
      mimeOptions: FILE_MIME_OPTIONS,
      canUpload: permissions.canCreate,
    },
    list: {
      isLoading: files.isLoading,
      isError: files.isError,
      onRetry: retryList,
      files: entries,
      page: filters.page,
      totalPages,
      total,
      onPageChange: (page) => onFilterChange("page", page),
      resultLabel: `${entries.length} files${total ? ` (${total} total)` : ""}`,
      onRowClick: handleRowClick,
      hasFilters,
      formatBytes,
      formatMimeType,
    },
    upload: {
      isPending: uploadFile.isPending,
      onUpload: handleUpload,
    },
    detail: {
      file: selectedFile,
      description: selectedFile
        ? `${selectedFile.sizeBytes} B · ${selectedFile.mimeType} · v${selectedFile.latestVersion}`
        : "",
      onClose: () => setSelectedFile(null),
      onDownload: handleDownload,
      onDelete: () => {
        if (selectedFile) setDeleteTarget(selectedFile);
      },
      canDelete: permissions.canDelete,
      isDownloading: downloadUrl.isPending,
    },
    versions: {
      data: versions.data?.data,
      isLoading: versions.isLoading,
      isError: versions.isError,
      onRetry: retryVersions,
    },
    history: {
      data: history.data?.data,
      isLoading: history.isLoading,
      isError: history.isError,
      onRetry: retryHistory,
    },
    detailTabs: {
      activeTab: detailTab,
      onTabChange: setDetailTab,
      uploadVersion: {
        isPending: uploadVersion.isPending,
        onUpload: handleUploadVersion,
        canUpload: permissions.canCreate,
      },
    },
    confirmDelete: {
      target: deleteTarget,
      isPending: deleteFile.isPending,
      onCancel: () => setDeleteTarget(null),
      onConfirm: handleConfirmDelete,
    },
    table,
  };
}
