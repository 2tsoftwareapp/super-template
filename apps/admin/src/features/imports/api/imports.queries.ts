"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchImportJob } from "./imports.api";
import { importsKeys } from "./imports.query-keys";

export function useImportJobQuery(jobId: string) {
  return useQuery({
    queryKey: importsKeys.detail(jobId),
    queryFn: () => fetchImportJob(jobId),
    enabled: Boolean(jobId),
  });
}
