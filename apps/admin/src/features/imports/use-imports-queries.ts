"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchImportJob } from "./imports-service";

export const IMPORT_JOB_QUERY_KEY = "admin-import-job" as const;

export function useImportJobQuery(jobId: string) {
  return useQuery({
    queryKey: [IMPORT_JOB_QUERY_KEY, jobId],
    queryFn: () => fetchImportJob(jobId),
    enabled: Boolean(jobId),
  });
}
