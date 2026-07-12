"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { cancelJob } from "../api/jobs-api";
import { JOB_METRICS_BASE_QUERY_KEY, JOBS_BASE_QUERY_KEY } from "../jobs-query-keys";

export function useCancelJobMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelJob,
    onSuccess: async () => {
      toast.success("Job cancelled");
      await queryClient.invalidateQueries({
        queryKey: [JOBS_BASE_QUERY_KEY],
      });
      await queryClient.invalidateQueries({
        queryKey: [JOB_METRICS_BASE_QUERY_KEY],
      });
      options?.onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to cancel job");
    },
  });
}
