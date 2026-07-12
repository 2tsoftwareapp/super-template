"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ApplicationSettingDto } from "@/lib/api-types";

import { updateSetting } from "./api/settings-api";
import { SETTINGS_QUERY_KEY } from "./model/settings-query-keys";

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
      await queryClient.invalidateQueries({ queryKey: [SETTINGS_QUERY_KEY] });
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}
