"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STATUS_OPTIONS = ["PENDING", "ACTIVE", "BLOCKED"] as const;
export type UserStatus = (typeof STATUS_OPTIONS)[number];

export function useUserStatus(
  currentStatus: UserStatus | undefined,
  updateStatus: {
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    mutateAsync: (status: UserStatus) => Promise<unknown>;
  },
  disabled: boolean,
) {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>("PENDING");

  useEffect(() => {
    if (currentStatus) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync when user data loads
      setSelectedStatus(currentStatus);
    }
  }, [currentStatus]);

  const canApply = !disabled && selectedStatus !== currentStatus;

  const handleApply = useCallback(async () => {
    try {
      await updateStatus.mutateAsync(selectedStatus);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [selectedStatus, updateStatus]);

  return {
    options: STATUS_OPTIONS,
    selected: selectedStatus,
    onSelect: setSelectedStatus,
    disabled,
    canApply,
    onApply: handleApply,
    state: {
      isPending: updateStatus.isPending,
      isSuccess: updateStatus.isSuccess,
      isError: updateStatus.isError,
    },
  };
}
