"use client";

import { useMutation } from "@tanstack/react-query";

import { deleteFile, uploadFile, uploadVersion } from "./files-service";

export function useDeleteFileMutation(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}

export function useUploadFileMutation(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}

export function useUploadVersionMutation(
  options?: { onSuccess?: () => void },
) {
  return useMutation({
    mutationFn: ({ fileId, file }: { fileId: string; file: File }) =>
      uploadVersion(fileId, file),
    onSuccess: () => {
      options?.onSuccess?.();
    },
  });
}
