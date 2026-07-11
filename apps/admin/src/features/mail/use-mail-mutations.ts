"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { SendAdminMailResultDto } from "@/lib/api-types";

import { sendMail, type SendMailInput } from "./mail-service";
import { MAIL_DELIVERIES_QUERY_KEY } from "./use-mail-queries";

export function useSendMailMutation(options?: {
  onSuccess?: (data: { data: SendAdminMailResultDto }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMailInput) => sendMail(input),
    onSuccess: async (result) => {
      toast.success(`Mail queued (job: ${result?.data?.jobId ?? "—"})`);
      await queryClient.invalidateQueries({
        queryKey: [MAIL_DELIVERIES_QUERY_KEY],
      });
      options?.onSuccess?.(result);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send mail");
    },
  });
}
