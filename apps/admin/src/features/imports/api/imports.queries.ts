"use client";

import { useQuery } from "@tanstack/react-query";

import { importsApi } from "./imports.api";
import { importsKeys } from "./imports.query-keys";

const LIVE_STATUSES = new Set(["PENDING", "PROCESSING"]);

export function useImportJobQuery(jobId: string) {
  return useQuery({
    queryKey: importsKeys.detail(jobId),
    queryFn: () => importsApi.get(jobId),
    enabled: Boolean(jobId),
    staleTime: (query) => {
      const status = query.state.data?.data?.status;
      return typeof status === "string" && LIVE_STATUSES.has(status) ? 0 : 30_000;
    },
  });
}
