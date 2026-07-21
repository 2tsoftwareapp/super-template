"use client";

import { useMutation } from "@tanstack/react-query";

import type { ImportJobDto } from "@/lib/api-types";

import {
  confirmImportJob,
  type CreateImportInput,
  createImportJob,
} from "./imports.api";

export function useCreateImportMutation(options?: {
  onSuccess?: (data: { data: ImportJobDto }) => void;
}) {
  return useMutation({
    mutationFn: (input: CreateImportInput) => createImportJob(input),
    onSuccess: (result) => {
      options?.onSuccess?.(result);
    },
  });
}

export function useConfirmImportMutation(options?: {
  onSuccess?: (data: { data: ImportJobDto }) => void;
}) {
  return useMutation({
    mutationFn: (id: string) => confirmImportJob(id),
    onSuccess: (result) => {
      options?.onSuccess?.(result);
    },
  });
}
