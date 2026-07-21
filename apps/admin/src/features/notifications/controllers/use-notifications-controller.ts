"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import type { NotificationsViewModel } from "@/features/notifications/model/notifications.types";
import type { SendNotificationInput } from "@/lib/api-types";

import {
  useCancelNotificationJobMutation,
  useSendNotificationMutation,
} from "@/features/notifications/api/notifications.mutations";
import {
  useNotificationJobsQuery,
  useRecentNotificationsQuery,
} from "@/features/notifications/api/notifications.queries";
import { notificationsKeys } from "@/features/notifications/api/notifications.query-keys";
import { notificationJobStatusProps } from "@/features/notifications/model/notifications.constants";
import { selectNotificationPermissions } from "@/features/notifications/model/notifications.permissions";
import { useSession } from "@/hooks/use-session";

export type { NotificationsViewModel };

/**
 * Orchestration hook for the notifications screen.
 *
 * Flow:
 *   1. Load delivery jobs + recent inbox in parallel (staleTime 0).
 *   2. Gate compose/cancel on `notifications.create`.
 *   3. Send/cancel mutations toast errors and invalidate related keys.
 * Owns: compose form, jobs/recent queries, send/cancel mutations.
 * Does not own: notification job table presentation.
 */
export function useNotificationsController(): NotificationsViewModel {
  const queryClient = useQueryClient();
  const session = useSession();
  const permissions = selectNotificationPermissions(
    session.data?.data.permissions,
  );

  const jobs = useNotificationJobsQuery();
  const recentNotifications = useRecentNotificationsQuery();

  const [audience, setAudience] = useState("ALL");
  const [userId, setUserId] = useState("");
  const [userIds, setUserIds] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const buildInput = (): SendNotificationInput => {
    const input: SendNotificationInput = {
      audience: audience as SendNotificationInput["audience"],
      type,
      title: title || "Test notification",
      body: body || "This is a test notification sent from the admin panel.",
    };
    if (audience === "USER") input.userId = userId;
    if (audience === "USERS")
      input.userIds = userIds
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    return input;
  };

  const send = useSendNotificationMutation({
    onSuccess: () => {
      toast.success("Notification queued.");
      setTitle("");
      setBody("");
      setType("SYSTEM");
      setUserId("");
      setUserIds("");
      setAudience("ALL");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const cancelJob = useCancelNotificationJobMutation({
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSend = () => {
    if (!permissions.canSend) return;
    send.mutate(buildInput());
  };

  const retryJobs = () => {
    void queryClient.invalidateQueries({
      queryKey: notificationsKeys.jobs(),
    });
  };
  const retryRecent = () => {
    void queryClient.invalidateQueries({
      queryKey: notificationsKeys.recent(),
    });
  };
  const handleRefresh = () => {
    void queryClient.invalidateQueries({
      queryKey: notificationsKeys.all,
    });
  };

  return {
    isRefreshing: jobs.isFetching || recentNotifications.isFetching,
    onRefresh: handleRefresh,
    compose: {
      canAccess: permissions.canSend,
      audience,
      userId,
      userIds,
      type,
      title,
      body,
      onAudienceChange: setAudience,
      onUserIdChange: setUserId,
      onUserIdsChange: setUserIds,
      onTypeChange: setType,
      onTitleChange: setTitle,
      onBodyChange: setBody,
      isSending: send.isPending,
      isError: send.isError,
      onRetrySend: handleSend,
      onSend: handleSend,
    },
    jobs: {
      isLoading: jobs.isLoading,
      isError: jobs.isError,
      onRetry: retryJobs,
      data: jobs.data?.data ?? [],
      onRefresh: retryJobs,
      canCancel: permissions.canCancel,
      isCancelling: cancelJob.isPending,
      onCancel: (jobId) => cancelJob.mutate(jobId),
      statusProps: notificationJobStatusProps,
    },
    recent: {
      isLoading: recentNotifications.isLoading,
      isError: recentNotifications.isError,
      onRetry: retryRecent,
      data: recentNotifications.data?.data ?? [],
    },
  };
}
