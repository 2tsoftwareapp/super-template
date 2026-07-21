"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { jobsApi } from "./jobs.api";
import { jobsKeys } from "./jobs.query-keys";

export function useCancelJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobsApi.cancel(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: jobsKeys.all });
    },
  });
}
