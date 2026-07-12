"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchFileHistory,
  fetchFiles,
  fetchFileVersions,
  type FilesParams,
} from "../api/files-api";
import { FILE_HISTORY_QUERY_KEY, FILE_VERSIONS_QUERY_KEY, FILES_QUERY_KEY } from "../files-query-keys";

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
