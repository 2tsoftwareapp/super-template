"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cancelJob } from "./jobs.api";
import { jobsKeys } from "./jobs.query-keys";

export function useCancelJobMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobsKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: jobsKeys.metrics,
      });
      options?.onSuccess?.();
    },
  });
}
