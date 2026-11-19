"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useCallback } from "react";
import { toast } from "sonner";

import type { BulkMutationResult } from "@/hooks/use-bulk-mutation";

export function useUsersBulkActions(
  activateUsers: {
    isPending: boolean;
    mutateAsync: (ids: string[]) => Promise<BulkMutationResult>;
  },
  blockUsers: { isPending: boolean; mutateAsync: (ids: string[]) => Promise<BulkMutationResult> },
  requestBlock: (userIds: string[], label: string, count: number) => void,
) {
  const handleBulkActivate = useCallback(
    async (selectedIds: string[], clearSelection: () => void) => {
      try {
        const result = await activateUsers.mutateAsync(selectedIds);

        if (result.failed > 0) {
          toast.warning(`${result.succeeded} activated, ${result.failed} failed`);
          return;
        }

        toast.success(`${result.succeeded} user${result.succeeded === 1 ? "" : "s"} activated`);
        clearSelection();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [activateUsers],
  );

  const handleBulkBlock = useCallback(
    (selectedIds: string[]) => {
      requestBlock(
        selectedIds,
        `${selectedIds.length} user${selectedIds.length > 1 ? "s" : ""}`,
        selectedIds.length,
      );
    },
    [requestBlock],
  );

  return {
    isMutating: activateUsers.isPending || blockUsers.isPending,
    handleBulkActivate,
    handleBulkBlock,
  };
}
