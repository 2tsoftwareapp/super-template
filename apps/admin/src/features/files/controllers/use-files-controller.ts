"use client";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";
import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import type { FilesViewModel } from "@/features/files/model/files.types";
import type { FileDto } from "@/lib/api-types";

import {
  useDeleteFileMutation,
  useGetFileDownloadUrlMutation,
  useUploadFileMutation,
  useUploadVersionMutation,
} from "@/features/files/api/files.mutations";
import {
  useFileHistoryQuery,
  useFilesQuery,
  useFileVersionsQuery,
} from "@/features/files/api/files.queries";
import { filesKeys } from "@/features/files/api/files.query-keys";
import {
  formatBytes,
  formatMimeType,
} from "@/features/files/model/files-formatting";
import { FILE_MIME_OPTIONS } from "@/features/files/model/files.constants";
import { selectFilePermissions } from "@/features/files/model/files.permissions";
import {
  type FilesFilters,
  parseFilesFilters,
  serializeFilesFilters,
} from "@/features/files/model/files.search-params";
import { useSession } from "@/hooks/use-session";
import { usePathname, useRouter } from "@/i18n/navigation";

export type { FilesViewModel };

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
export function useFilesController(): FilesViewModel {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const session = useSession();
  const permissions = selectFilePermissions(session.data?.data.permissions);

  const [filters, setFilters] = useState<FilesFilters>(() =>
    parseFilesFilters(new URLSearchParams(searchParams.toString())),
  );
  const [selectedFile, setSelectedFile] = useState<FileDto | null>(null);
  const [detailTab, setDetailTab] = useState<"versions" | "history">(
    "versions",
  );
  const [deleteTarget, setDeleteTarget] = useState<FileDto | null>(null);

  const onFilterChange = (
    key: keyof FilesFilters,
    value: string | number,
  ) => {
    const next = { ...filters, [key]: value };
    if (key !== "page") {
      next.page = 1;
    }
    setFilters(next);
    const qs = serializeFilesFilters(next);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onClearFilters = () => {
    setFilters({ q: "", mime: "", page: 1 });
    router.replace(pathname, { scroll: false });
  };

  const hasFilters = Boolean(filters.q || filters.mime);
  const debouncedSearch = useDebouncedValue(filters.q, 400);

  const files = useFilesQuery({
    search: debouncedSearch,
    mimeFilter: filters.mime || undefined,
    page: filters.page,
  });

  const versions = useFileVersionsQuery(selectedFile?.id);
  const history = useFileHistoryQuery(selectedFile?.id);

  const deleteFile = useDeleteFileMutation();
  const uploadFile = useUploadFileMutation();
  const uploadVersion = useUploadVersionMutation();
  const downloadUrl = useGetFileDownloadUrlMutation();

  const entries = files.data?.data ?? [];
  const totalPages = files.data?.meta?.totalPages ?? 1;
  const total = files.data?.meta?.total ?? 0;

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

  const handleDownload = () => {
    if (!selectedFile) return;
    downloadUrl.mutate(selectedFile.id, {
      onSuccess: (url) => {
        window.open(url, "_blank");
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const handleUpload = (file: File) => {
    uploadFile.mutate(file, {
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const handleUploadVersion = (file: File) => {
    if (!selectedFile) return;
    uploadVersion.mutate(
      { fileId: selectedFile.id, file },
      {
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    deleteFile.mutate(targetId, {
      onSuccess: () => {
        setDeleteTarget(null);
        if (selectedFile?.id === targetId) {
          setSelectedFile(null);
        }
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
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
      onDeleteClick: (file) => setDeleteTarget(file),
      hasFilters,
      canDelete: permissions.canDelete,
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
  };
}
