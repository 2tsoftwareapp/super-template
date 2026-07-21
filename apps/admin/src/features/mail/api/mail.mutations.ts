"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SendMailInput } from "@/features/mail/model/mail.types";
import type { SendAdminMailResultDto } from "@/lib/api-types";

import { mailApi } from "./mail.api";
import { mailKeys } from "./mail.query-keys";

export function useSendMailMutation(options?: {
  onSuccess?: (data: { data: SendAdminMailResultDto }) => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMailInput) => mailApi.send(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: mailKeys.lists() });
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}
