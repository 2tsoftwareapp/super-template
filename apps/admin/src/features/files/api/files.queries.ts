"use client";

import { useQuery } from "@tanstack/react-query";

import { filesApi, type FilesParams } from "./files.api";
import { filesKeys } from "./files.query-keys";

export function useFilesQuery(params: FilesParams) {
  return useQuery({
    queryKey: filesKeys.list({
      search: params.search,
      mimeFilter: params.mimeFilter,
      page: params.page,
      sortField: params.sortField,
      sortOrder: params.sortOrder,
    }),
    queryFn: () => filesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useFileVersionsQuery(fileId: string | undefined) {
  return useQuery({
    queryKey: filesKeys.versions(fileId ?? ""),
    queryFn: () => filesApi.versions(fileId!),
    enabled: !!fileId,
    placeholderData: (previous) => previous,
  });
}

export function useFileHistoryQuery(fileId: string | undefined) {
  return useQuery({
    queryKey: filesKeys.history(fileId ?? ""),
    queryFn: () => filesApi.history(fileId!),
    enabled: !!fileId,
    placeholderData: (previous) => previous,
  });
}
