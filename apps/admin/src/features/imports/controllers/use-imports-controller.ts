"use client";

import { getErrorMessage } from "@repo/web-utils/errors";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import type { CreateImportFormValues } from "@/features/imports/model/imports.schemas";
import type { ImportsViewModel } from "@/features/imports/model/imports.types";

import {
  useConfirmImportMutation,
  useCreateImportMutation,
} from "@/features/imports/api/imports.mutations";
import { useImportJobQuery } from "@/features/imports/api/imports.queries";
import { importsKeys } from "@/features/imports/api/imports.query-keys";
import { IMPORT_TYPES } from "@/features/imports/model/imports.constants";
import { selectImportPermissions } from "@/features/imports/model/imports.permissions";
import { useSession } from "@/hooks/use-session";

export type { ImportsViewModel };

/**
 * Orchestration hook for the imports screen.
 *
 * Flow:
 *   1. Create form (RHF+zod) → create mutation; on success seed the lookup.
 *   2. Lookup/refetch job detail; live jobs use staleTime 0.
 *   3. Confirm dialog → confirm mutation; close only on success.
 * Owns: create/confirm mutations, detail selection.
 * Does not own: import row presentation.
 */
export function useImportsController(): ImportsViewModel {
  const session = useSession();
  const permissions = selectImportPermissions(session.data?.data.permissions);
  const queryClient = useQueryClient();

  const [jobId, setJobId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const job = useImportJobQuery(jobId);
  const createImport = useCreateImportMutation();
  const confirm = useConfirmImportMutation();

  const jobData = job.data?.data;
  const status = typeof jobData?.status === "string" ? jobData.status : "";

  const handleCreate = (values: CreateImportFormValues) => {
    createImport.mutate(values, {
      onSuccess: (result) => {
        setJobId(result.data.id);
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
      isCreating: createImport.isPending,
      canCreate: permissions.canCreate,
      importTypes: IMPORT_TYPES,
      onSubmit: handleCreate,
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
