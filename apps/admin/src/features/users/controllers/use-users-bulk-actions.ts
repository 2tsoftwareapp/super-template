"use client";

import { useCallback } from "react";

export function useUsersBulkActions(
  activateUsers: { isPending: boolean; mutateAsync: (ids: string[]) => Promise<unknown> },
  blockUsers: { isPending: boolean; mutateAsync: (ids: string[]) => Promise<unknown> },
  requestBlock: (userIds: string[], label: string, count: number) => void,
) {
  const handleBulkActivate = useCallback(
    async (selectedIds: string[], clearSelection: () => void) => {
      await activateUsers.mutateAsync(selectedIds);
      clearSelection();
    },
    [activateUsers],
  );

  const handleBulkBlock = useCallback(
    (selectedIds: string[]) => {
      requestBlock(selectedIds, `${selectedIds.length} user${selectedIds.length > 1 ? "s" : ""}`, selectedIds.length);
    },
    [requestBlock],
  );

  return {
    isMutating: activateUsers.isPending || blockUsers.isPending,
    handleBulkActivate,
    handleBulkBlock,
  };
}
