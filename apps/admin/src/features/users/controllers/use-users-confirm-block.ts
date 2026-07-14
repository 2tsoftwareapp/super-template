"use client";

import { useCallback, useState } from "react";

interface ConfirmBlockState {
  userIds: string[];
  label: string;
  count: number;
}

export function useUsersConfirmBlock() {
  const [confirmBlock, setConfirmBlock] = useState<ConfirmBlockState | null>(null);

  const requestBlock = useCallback((userIds: string[], label: string, count: number) => {
    setConfirmBlock({ userIds, label, count });
  }, []);

  const cancelBlock = useCallback(() => {
    setConfirmBlock(null);
  }, []);

  return { confirmBlock, requestBlock, cancelBlock };
}
