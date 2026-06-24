"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/http";

export function useBulkMutation({
  mutationFn,
  queryKey,
  successMessage,
}: {
  mutationFn: (id: string) => Promise<unknown>;
  queryKey: string[];
  successMessage?: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => mutationFn(id)),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (failed > 0 && succeeded === 0) {
        const first = results.find((r) => r.status === "rejected")!;
        throw first.reason;
      }
      return { succeeded, failed, total: ids.length };
    },
    onSuccess: async ({ succeeded, failed, total }) => {
      await queryClient.invalidateQueries({ queryKey });
      if (failed > 0) {
        toast.error(`${failed} of ${total} failed`);
      } else {
        toast.success(
          successMessage
            ? `${succeeded} ${successMessage}`
            : `${succeeded} updated`,
        );
      }
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Could not complete operation";
      toast.error(message);
    },
  });
}
