"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchFileHistory,
  fetchFiles,
  fetchFileVersions,
  type FilesParams,
} from "./files.api";
import { filesKeys } from "./files.query-keys";

export function useFilesQuery(params: FilesParams) {
  return useQuery({
    queryKey: filesKeys.list({ search: params.search, mimeFilter: params.mimeFilter, page: params.page }),
    queryFn: () => fetchFiles(params),
    placeholderData: (previous) => previous,
  });
}

export function useFileVersionsQuery(fileId: string | undefined) {
  return useQuery({
    queryKey: filesKeys.versions(fileId ?? ""),
    queryFn: () => fetchFileVersions(fileId!),
    enabled: !!fileId,
  });
}

export function useFileHistoryQuery(fileId: string | undefined) {
  return useQuery({
    queryKey: filesKeys.history(fileId ?? ""),
    queryFn: () => fetchFileHistory(fileId!),
    enabled: !!fileId,
  });
}
