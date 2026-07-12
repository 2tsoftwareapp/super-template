"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchImportJob } from "./api/imports-api";
import { IMPORT_JOB_QUERY_KEY } from "./model/imports-query-keys";

export function useImportJobQuery(jobId: string) {
  return useQuery({
    queryKey: [IMPORT_JOB_QUERY_KEY, jobId],
    queryFn: () => fetchImportJob(jobId),
    enabled: Boolean(jobId),
  });
}
