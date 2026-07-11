"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ImportJobDto } from "@/lib/api-types";

import {
  confirmImportJob,
  type CreateImportInput,
  createImportJob,
} from "./imports-service";

export function useCreateImportMutation(options?: {
  onSuccess?: (data: { data: ImportJobDto }) => void;
}) {
  return useMutation({
    mutationFn: (input: CreateImportInput) => createImportJob(input),
    onSuccess: (result) => {
      toast.success("Import job created");
      options?.onSuccess?.(result);
    },
    onError: () => {
      toast.error("Failed to create import");
    },
  });
}

export function useConfirmImportMutation(options?: {
  onSuccess?: (data: { data: ImportJobDto }) => void;
}) {
  return useMutation({
    mutationFn: (id: string) => confirmImportJob(id),
    onSuccess: (result) => {
      toast.success("Import confirmed");
      options?.onSuccess?.(result);
    },
    onError: () => {
      toast.error("Failed to confirm import");
    },
  });
}
