"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { NotificationJobDto, SendNotificationInput } from "@/lib/api-types";

import { notificationsApi } from "./notifications.api";
import { notificationsKeys } from "./notifications.query-keys";

export function useSendNotificationMutation(options?: {
  onSuccess?: (data: { data: NotificationJobDto }) => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendNotificationInput) => notificationsApi.send(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: notificationsKeys.all,
      });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}

export function useCancelNotificationJobMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => notificationsApi.cancelJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationsKeys.jobs(),
      });
      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
