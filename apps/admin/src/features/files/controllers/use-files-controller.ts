"use client";

import { useState } from "react";

import type {
  FileDto,
  FileHistoryEventDto,
  FileVersionDto,
} from "@/lib/api-types";

import { getFileDownloadUrl } from "@/features/files/api/files-api";
import {
  useDeleteFileMutation,
  useUploadFileMutation,
  useUploadVersionMutation,
} from "@/features/files/mutations/use-files-mutations";
import {
  useFileHistoryQuery,
  useFilesQuery,
  useFileVersionsQuery,
} from "@/features/files/queries/use-files-queries";

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
  };
  list: {
    isLoading: boolean;
    files: FileDto[];
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
    resultLabel: string;
    onRowClick: (file: FileDto) => void;
    onDeleteClick: (file: FileDto) => void;
    hasFilters: boolean;
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
  };
  versions: {
    data: FileVersionDto[] | undefined;
    isLoading: boolean;
  };
  history: {
    data: FileHistoryEventDto[] | undefined;
    isLoading: boolean;
  };
  detailTabs: {
    activeTab: "versions" | "history";
    onTabChange: (tab: "versions" | "history") => void;
    uploadVersion: {
      isPending: boolean;
      onUpload: (file: File) => void;
    };
  };
  confirmDelete: {
    target: FileDto | null;
    isPending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
  };
}

export function useFilesController(): FilesViewModel {
  const [search, setSearch] = useState("");
  const [mimeFilter, setMimeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<FileDto | null>(null);
  const [detailTab, setDetailTab] = useState<"versions" | "history">(
    "versions",
  );
  const [deleteTarget, setDeleteTarget] = useState<FileDto | null>(null);

  const files = useFilesQuery({
    search,
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
  const hasFilters = Boolean(mimeFilter || search);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleMimeFilterChange = (value: string) => {
    setMimeFilter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setMimeFilter("");
    setSearch("");
    setPage(1);
  };

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
      onSearchChange: handleSearchChange,
      hasFilters,
      onClearFilters: clearFilters,
      mimeFilter,
      onMimeFilterChange: handleMimeFilterChange,
    },
    list: {
      isLoading: files.isLoading,
      files: entries,
      page,
      totalPages,
      total,
      onPageChange: setPage,
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
