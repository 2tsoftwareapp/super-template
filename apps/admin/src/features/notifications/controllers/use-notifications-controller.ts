"use client";

import { useState } from "react";

import type { SendNotificationInput } from "@/lib/api-types";

import {
  useCancelNotificationJobMutation,
  useSendNotificationMutation,
} from "@/features/notifications/api/notifications.mutations";
import {
  useNotificationJobsQuery,
  useRecentNotificationsQuery,
} from "@/features/notifications/api/notifications.queries";

type NotificationJob = NonNullable<
  ReturnType<typeof useNotificationJobsQuery>["data"]
>["data"][number];
type RecentNotification = NonNullable<
  ReturnType<typeof useRecentNotificationsQuery>["data"]
>["data"][number];

export interface NotificationsViewModel {
  isRefreshing: boolean;
  onRefresh: () => void;
  compose: {
    audience: string;
    userId: string;
    userIds: string;
    type: string;
    title: string;
    body: string;
    onAudienceChange: (value: string) => void;
    onUserIdChange: (value: string) => void;
    onUserIdsChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    onTitleChange: (value: string) => void;
    onBodyChange: (value: string) => void;
    isSending: boolean;
    isError: boolean;
    onSend: () => void;
  };
  jobs: {
    isLoading: boolean;
    data: NotificationJob[];
    onRefresh: () => void;
    isCancelling: boolean;
    onCancel: (jobId: string) => void;
  };
  recent: {
    isLoading: boolean;
    data: RecentNotification[];
  };
}

/**
 * Orchestration hook for the notifications screen: compose-form state, send +
 * cancel mutations, delivery-jobs and recent-notifications queries. Returns a
 * view model consumed by the presentational NotificationsView.
 */
export function useNotificationsController(): NotificationsViewModel {
  const jobs = useNotificationJobsQuery();
  const recentNotifications = useRecentNotificationsQuery();

  const [audience, setAudience] = useState("ALL");
  const [userId, setUserId] = useState("");
  const [userIds, setUserIds] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const send = useSendNotificationMutation({
    onSuccess: () => {
      setTitle("");
      setBody("");
      setType("SYSTEM");
      setUserId("");
      setUserIds("");
      setAudience("ALL");
    },
  });

  const cancelJob = useCancelNotificationJobMutation();

  const handleSend = () => {
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
    send.mutate(input);
  };

  const invalidateAll = () => {
    void jobs.refetch();
    void recentNotifications.refetch();
  };

  return {
    isRefreshing: jobs.isFetching || recentNotifications.isFetching,
    onRefresh: invalidateAll,
    compose: {
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
      onSend: handleSend,
    },
    jobs: {
      isLoading: jobs.isLoading,
      data: jobs.data?.data ?? [],
      onRefresh: () => void jobs.refetch(),
      isCancelling: cancelJob.isPending,
      onCancel: (jobId) => cancelJob.mutate(jobId),
    },
    recent: {
      isLoading: recentNotifications.isLoading,
      data: recentNotifications.data?.data ?? [],
    },
  };
}
