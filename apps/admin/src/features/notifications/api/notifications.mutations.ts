"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      toast.success("Notification job queued");
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.jobs,
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
        queryKey: notificationsKeys.jobs,
      });
      options?.onSuccess?.();
    },
  });
}
