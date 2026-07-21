import type { ImportJobDto } from "@/lib/api-types";

import type { IMPORT_TYPES } from "./imports.constants";

export interface ImportsViewModel {
  form: {
    fileId: string;
    type: string;
    onFileIdChange: (value: string) => void;
    onTypeChange: (value: string) => void;
    canSubmit: boolean;
    isCreating: boolean;
    canCreate: boolean;
    importTypes: typeof IMPORT_TYPES;
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
    onRetry: () => void;
    data: ImportJobDto | undefined;
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
