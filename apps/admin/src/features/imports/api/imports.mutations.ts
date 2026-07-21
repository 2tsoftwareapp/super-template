"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type CreateImportInput, importsApi } from "./imports.api";
import { importsKeys } from "./imports.query-keys";

export function useCreateImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateImportInput) => importsApi.create(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: importsKeys.detail(result.data.id),
      });
      void queryClient.setQueryData(importsKeys.detail(result.data.id), result);
    },
  });
}

export function useConfirmImportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importsApi.confirm(id),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: importsKeys.detail(result.data.id),
      });
    },
  });
}
