"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useState } from "react";
import { toast } from "sonner";

import type { FileDto } from "@/lib/api-types";

import {
  useDeleteFileMutation,
  useGetFileDownloadUrlMutation,
  useUploadFileMutation,
  useUploadVersionMutation,
} from "@/features/files/api/files.mutations";

interface UseFilesMutationsOptions {
  selectedFile: FileDto | null;
  setSelectedFile: (file: FileDto | null) => void;
}

/**
 * Mutation orchestration for the files screen: upload, upload-version,
 * download (signed URL), and delete with confirm target state. Extracted
 * from useFilesController to keep each hook focused.
 */
export function useFilesMutations({ selectedFile, setSelectedFile }: UseFilesMutationsOptions) {
  const [deleteTarget, setDeleteTarget] = useState<FileDto | null>(null);

  const deleteFile = useDeleteFileMutation();
  const uploadFile = useUploadFileMutation();
  const uploadVersion = useUploadVersionMutation();
  const downloadUrl = useGetFileDownloadUrlMutation();

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
    deleteTarget,
    deleteFile,
    uploadFile,
    uploadVersion,
    downloadUrl,
    handleDownload,
    handleUpload,
    handleUploadVersion,
    handleConfirmDelete,
    setDeleteTarget,
  };
}
