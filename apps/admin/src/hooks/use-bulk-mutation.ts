"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface BulkMutationResult {
  succeeded: number;
  failed: number;
  total: number;
}

/**
 * Runs one mutation per id and reports the counts instead of hiding a partial
 * failure. It only rejects when *every* item failed, so callers must inspect
 * `failed` and tell the operator what actually happened.
 */
export function useBulkMutation({
  mutationFn,
  queryKey,
}: {
  mutationFn: (id: string) => Promise<unknown>;
  queryKey: readonly string[];
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]): Promise<BulkMutationResult> => {
      const results = await Promise.allSettled(ids.map((id) => mutationFn(id)));
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0 && succeeded === 0) {
        const first = results.find((r) => r.status === "rejected")!;
        throw first.reason;
      }
      return { succeeded, failed, total: ids.length };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
