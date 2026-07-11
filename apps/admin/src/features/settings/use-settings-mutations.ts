"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApplicationSettingDto } from "@/lib/api-types";

import { updateSetting } from "./settings-service";

export function useUpdateSettingMutation(options?: {
  onSuccess?: (data: { data: ApplicationSettingDto }) => void;
  onError?: (err: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      value,
    }: {
      key: string;
      value: ApplicationSettingDto["value"];
    }) => updateSetting(key, value),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}
