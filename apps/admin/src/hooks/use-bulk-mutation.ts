"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useBulkMutation({
  mutationFn,
  queryKey,
}: {
  mutationFn: (id: string) => Promise<unknown>;
  queryKey: readonly string[];
  successMessage?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
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
