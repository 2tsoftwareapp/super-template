"use client";

import { useState } from "react";

import { useDebouncedValue } from "@repo/web-hooks/use-debounced-value";

import type { FileDto } from "@/lib/api-types";

import { getFileDownloadUrl } from "@/features/files/api/files.api";
import {
  useDeleteFileMutation,
  useUploadFileMutation,
  useUploadVersionMutation,
} from "@/features/files/api/files.mutations";
import {
  useFileHistoryQuery,
  useFilesQuery,
  useFileVersionsQuery,
} from "@/features/files/api/files.queries";

import type { FilesViewModel } from "./files-view-model";

import { useFilePagination } from "./use-file-pagination";

export function useFilesController(): FilesViewModel {
  const {
    search,
    mimeFilter,
    page,
    hasFilters,
    onSearchChange,
    onMimeFilterChange,
    onClearFilters,
    onPageChange,
  } = useFilePagination();

  const [selectedFile, setSelectedFile] = useState<FileDto | null>(null);
  const [detailTab, setDetailTab] = useState<"versions" | "history">(
    "versions",
  );
  const [deleteTarget, setDeleteTarget] = useState<FileDto | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);

  const files = useFilesQuery({
    search: debouncedSearch,
    mimeFilter,
    page,
  });

  const versions = useFileVersionsQuery(selectedFile?.id);
  const history = useFileHistoryQuery(selectedFile?.id);

  const deleteFile = useDeleteFileMutation({
    onSuccess: () => {
      void files.refetch();
      setSelectedFile(null);
    },
  });

  const uploadFile = useUploadFileMutation({
    onSuccess: () => {
      void files.refetch();
    },
  });

  const uploadVersion = useUploadVersionMutation({
    onSuccess: () => {
      void versions.refetch();
      void history.refetch();
      void files.refetch();
    },
  });

  const entries = files.data?.data ?? [];
  const totalPages = files.data?.meta?.totalPages ?? 1;
  const total = files.data?.meta?.total ?? 0;

  const handleRowClick = (file: FileDto) => {
    setSelectedFile(file);
    setDetailTab("versions");
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    const url = await getFileDownloadUrl(selectedFile.id);
    window.open(url, "_blank");
  };

  return {
    header: {
      isFetching: files.isFetching,
      total,
      onRefresh: () => void files.refetch(),
    },
    toolbar: {
      search,
      onSearchChange,
      hasFilters,
      onClearFilters,
      mimeFilter,
      onMimeFilterChange,
    },
    list: {
      isLoading: files.isLoading,
      files: entries,
      page,
      totalPages,
      total,
      onPageChange,
      resultLabel: `${entries.length} files${total ? ` (${total} total)` : ""}`,
      onRowClick: handleRowClick,
      onDeleteClick: (file) => setDeleteTarget(file),
      hasFilters,
    },
    upload: {
      isPending: uploadFile.isPending,
      onUpload: (file: File) => uploadFile.mutate(file),
    },
    detail: {
      file: selectedFile,
      description: selectedFile
        ? `${selectedFile.sizeBytes} B · ${selectedFile.mimeType} · v${selectedFile.latestVersion}`
        : "",
      onClose: () => setSelectedFile(null),
      onDownload: () => void handleDownload(),
      onDelete: () => {
        if (selectedFile) setDeleteTarget(selectedFile);
      },
    },
    versions: {
      data: versions.data?.data,
      isLoading: versions.isLoading,
    },
    history: {
      data: history.data?.data,
      isLoading: history.isLoading,
    },
    detailTabs: {
      activeTab: detailTab,
      onTabChange: setDetailTab,
      uploadVersion: {
        isPending: uploadVersion.isPending,
        onUpload: (file: File) => {
          if (selectedFile) uploadVersion.mutate({ fileId: selectedFile.id, file });
        },
      },
    },
    confirmDelete: {
      target: deleteTarget,
      isPending: deleteFile.isPending,
      onCancel: () => setDeleteTarget(null),
      onConfirm: () => {
        if (deleteTarget) {
          deleteFile.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }
      },
    },
  };
}
