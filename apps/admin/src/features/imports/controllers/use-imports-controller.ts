"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import type { ImportsViewModel } from "@/features/imports/model/imports.types";

import {
  useConfirmImportMutation,
  useCreateImportMutation,
} from "@/features/imports/api/imports.mutations";
import { useImportJobQuery } from "@/features/imports/api/imports.queries";
import { importsKeys } from "@/features/imports/api/imports.query-keys";
import { DEFAULT_IMPORT_TYPE, IMPORT_TYPES } from "@/features/imports/model/imports.constants";
import { selectImportPermissions } from "@/features/imports/model/imports.permissions";
import { createImportSchema } from "@/features/imports/model/imports.schemas";
import { useSession } from "@/hooks/use-session";

export type { ImportsViewModel };

/**
 * Orchestration hook for the imports screen.
 *
 * Flow:
 *   1. Validate create form (file UUID + type) → create mutation.
 *   2. On success, set lookup jobId and seed the detail query cache.
 *   3. Lookup/refetch job detail; live jobs use staleTime 0.
 *   4. Confirm dialog → confirm mutation; close only on success.
 * Owns: import list filters, create/confirm mutations, detail selection.
 * Does not own: import row presentation.
 */
export function useImportsController(): ImportsViewModel {
  const session = useSession();
  const permissions = selectImportPermissions(session.data?.data.permissions);
  const queryClient = useQueryClient();

  const [fileId, setFileId] = useState("");
  const [type, setType] = useState<string>(DEFAULT_IMPORT_TYPE);
  const [jobId, setJobId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const job = useImportJobQuery(jobId);
  const createImport = useCreateImportMutation();
  const confirm = useConfirmImportMutation();

  const jobData = job.data?.data;
  const status = typeof jobData?.status === "string" ? jobData.status : "";

  const parsedCreate = createImportSchema.safeParse({ fileId, type });

  const handleCreate = () => {
    if (!parsedCreate.success) {
      toast.error(parsedCreate.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    createImport.mutate(parsedCreate.data, {
      onSuccess: (result) => {
        setJobId(result.data.id);
        setFileId("");
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  const handleRefresh = () => {
    if (!jobId) return;
    void queryClient.invalidateQueries({ queryKey: importsKeys.detail(jobId) });
  };

  const handleConfirm = () => {
    if (!jobId) return;
    confirm.mutate(jobId, {
      onSuccess: () => {
        setConfirmOpen(false);
      },
      onError: (error) => {
        toast.error(getErrorMessage(error));
      },
    });
  };

  return {
    form: {
      fileId,
      type,
      onFileIdChange: setFileId,
      onTypeChange: setType,
      canSubmit: parsedCreate.success && permissions.canCreate,
      isCreating: createImport.isPending,
      canCreate: permissions.canCreate,
      importTypes: IMPORT_TYPES,
      onCreate: handleCreate,
    },
    lookup: {
      jobId,
      onJobIdChange: setJobId,
      onRefresh: handleRefresh,
      isFetching: job.isFetching,
    },
    job: {
      isLoading: job.isLoading,
      isError: job.isError,
      onRetry: handleRefresh,
      data: jobData,
      status,
    },
    confirm: {
      open: confirmOpen,
      isConfirming: confirm.isPending,
      canConfirm: permissions.canUpdate && (status === "PENDING" || status === "PROCESSING"),
      onOpen: () => setConfirmOpen(true),
      onCancel: () => setConfirmOpen(false),
      onConfirm: handleConfirm,
    },
  };
}
