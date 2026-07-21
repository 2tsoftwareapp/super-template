"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { filesApi } from "./files.api";
import { filesKeys } from "./files.query-keys";

function useInvalidateFiles() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: filesKeys.all });
  };
}

export function useDeleteFileMutation() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: (fileId: string) => filesApi.delete(fileId),
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUploadFileMutation() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: (file: File) => filesApi.upload(file),
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useUploadVersionMutation() {
  const invalidate = useInvalidateFiles();
  return useMutation({
    mutationFn: ({ fileId, file }: { fileId: string; file: File }) =>
      filesApi.uploadVersion(fileId, file),
    onSuccess: () => {
      invalidate();
    },
  });
}

export function useGetFileDownloadUrlMutation() {
  return useMutation({
    mutationFn: (fileId: string) => filesApi.getDownloadUrl(fileId),
  });
}
