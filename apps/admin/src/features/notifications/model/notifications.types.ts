import type { NotificationDto, NotificationJobDto } from "@/lib/api-types";

export interface NotificationsViewModel {
  isRefreshing: boolean;
  onRefresh: () => void;
  compose: {
    canAccess: boolean;
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
    onRetrySend: () => void;
    onSend: () => void;
  };
  jobs: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    data: NotificationJobDto[];
    onRefresh: () => void;
    canCancel: boolean;
    isCancelling: boolean;
    onCancel: (jobId: string) => void;
    statusProps: (status: string) => {
      variant: "default" | "secondary" | "outline";
      className?: string;
    };
  };
  recent: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    data: NotificationDto[];
  };
}
