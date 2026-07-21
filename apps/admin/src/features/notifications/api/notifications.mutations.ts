"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { NotificationJobDto, SendNotificationInput } from "@/lib/api-types";

import { cancelNotificationJob, sendNotification } from "./notifications.api";
import { notificationsKeys } from "./notifications.query-keys";

export function useSendNotificationMutation(options?: {
  onSuccess?: (data: { data: NotificationJobDto }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendNotificationInput) => sendNotification(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.jobs,
      });
      options?.onSuccess?.(result);
    },
  });
}

export function useCancelNotificationJobMutation(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelNotificationJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.jobs,
      });
      options?.onSuccess?.();
    },
  });
}
