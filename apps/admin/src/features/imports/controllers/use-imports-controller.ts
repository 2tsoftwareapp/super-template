"use client";

import { useState } from "react";

import {
  useConfirmImportMutation,
  useCreateImportMutation,
} from "@/features/imports/api/imports.mutations";
import { useImportJobQuery } from "@/features/imports/api/imports.queries";

type ImportJob = NonNullable<
  ReturnType<typeof useImportJobQuery>["data"]
>["data"];

export interface ImportsViewModel {
  form: {
    fileId: string;
    type: string;
    onFileIdChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    canSubmit: boolean;
    isCreating: boolean;
    onCreate: () => void;
  };
  lookup: {
    jobId: string;
    onJobIdChange: (value: string) => void;
    onRefresh: () => void;
    isFetching: boolean;
  };
  job: {
    isLoading: boolean;
    isError: boolean;
    data: ImportJob | undefined;
    status: string;
  };
  confirm: {
    open: boolean;
    isConfirming: boolean;
    canConfirm: boolean;
    onOpen: () => void;
    onCancel: () => void;
    onConfirm: () => void;
  };
}

/**
 * Orchestration hook for the imports screen: create-import form state, job
 * lookup query, confirm mutation and dialog state. Returns a view model
 * consumed by the presentational ImportsView.
 */
export function useImportsController(): ImportsViewModel {
  const [fileId, setFileId] = useState("");
  const [type, setType] = useState("users");
  const [jobId, setJobId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const job = useImportJobQuery(jobId);

  const createImport = useCreateImportMutation({
    onSuccess: (result) => {
      setJobId(result.data.id);
      setFileId("");
    },
  });

  const confirm = useConfirmImportMutation({
    onSuccess: () => {
      void job.refetch();
    },
  });

  const jobData = job.data?.data;
  const status = typeof jobData?.status === "string" ? jobData.status : "";

  return {
    form: {
      fileId,
      type,
      onFileIdChange: setFileId,
      onTypeChange: setType,
      canSubmit: Boolean(fileId && type),
      isCreating: createImport.isPending,
      onCreate: () => createImport.mutate({ fileId, type }),
    },
    lookup: {
      jobId,
      onJobIdChange: setJobId,
      onRefresh: () => void job.refetch(),
      isFetching: job.isFetching,
    },
    job: {
      isLoading: job.isLoading,
      isError: job.isError,
      data: jobData,
      status,
    },
    confirm: {
      open: confirmOpen,
      isConfirming: confirm.isPending,
      canConfirm: status === "PENDING" || status === "PROCESSING",
      onOpen: () => setConfirmOpen(true),
      onCancel: () => setConfirmOpen(false),
      onConfirm: () => {
        confirm.mutate(jobId);
        setConfirmOpen(false);
      },
    },
  };
}
