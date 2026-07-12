"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { NotificationJobDto, SendNotificationInput } from "@/lib/api-types";

import { cancelNotificationJob, sendNotification } from "./api/notifications-api";
import { NOTIFICATION_JOBS_QUERY_KEY } from "./model/notifications-query-keys";

export function useSendNotificationMutation(options?: {
  onSuccess?: (data: { data: NotificationJobDto }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendNotificationInput) => sendNotification(input),
    onSuccess: (result) => {
      toast.success("Notification job queued");
      void queryClient.invalidateQueries({
        queryKey: [NOTIFICATION_JOBS_QUERY_KEY],
      });
      options?.onSuccess?.(result);
    },
    onError: () => {
      toast.error("Failed to queue notification");
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
      toast.success("Job cancelled");
      void queryClient.invalidateQueries({
        queryKey: [NOTIFICATION_JOBS_QUERY_KEY],
      });
      options?.onSuccess?.();
    },
  });
}
