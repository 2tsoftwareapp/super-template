"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { cancelJob } from "../api/jobs-api";
import { jobsKeys } from "../jobs-query-keys";

export function useCancelJobMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelJob,
    onSuccess: async () => {
      toast.success("Job cancelled");
      await queryClient.invalidateQueries({
        queryKey: jobsKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: jobsKeys.metrics,
      });
      options?.onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to cancel job");
    },
  });
}
