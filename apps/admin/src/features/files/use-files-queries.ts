"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchFileHistory,
  fetchFiles,
  fetchFileVersions,
  type FilesParams,
} from "./files-service";

export const FILES_QUERY_KEY = "admin-files" as const;
export const FILE_VERSIONS_QUERY_KEY = "admin-file-versions" as const;
export const FILE_HISTORY_QUERY_KEY = "admin-file-history" as const;

export function useFilesQuery(params: FilesParams) {
  return useQuery({
    queryKey: [FILES_QUERY_KEY, params.search, params.mimeFilter, params.page],
    queryFn: () => fetchFiles(params),
  });
}

export function useFileVersionsQuery(fileId: string | undefined) {
  return useQuery({
    queryKey: [FILE_VERSIONS_QUERY_KEY, fileId],
    queryFn: () => fetchFileVersions(fileId!),
    enabled: !!fileId,
  });
}

export function useFileHistoryQuery(fileId: string | undefined) {
  return useQuery({
    queryKey: [FILE_HISTORY_QUERY_KEY, fileId],
    queryFn: () => fetchFileHistory(fileId!),
    enabled: !!fileId,
  });
}
