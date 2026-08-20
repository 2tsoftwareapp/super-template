import type { ImportJobDto } from "@/lib/api-types";

import type { IMPORT_TYPES } from "./imports.constants";
import type { CreateImportFormValues } from "./imports.schemas";

export interface ImportsViewModel {
  form: {
    isCreating: boolean;
    canCreate: boolean;
    importTypes: typeof IMPORT_TYPES;
    onSubmit: (values: CreateImportFormValues) => void;
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
