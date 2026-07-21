import type { ImportJobDto } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export interface CreateImportInput {
  fileId: string;
  type: string;
}

/**
 * Imports transport layer. Paths match OpenAPI `/api/v1/imports` via BFF.
 */
export const importsApi = {
  create(input: CreateImportInput) {
    return webFetch<{ data: ImportJobDto }>("/api/bff/imports", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  get(jobId: string) {
    return webFetch<{ data: ImportJobDto }>(`/api/bff/imports/${jobId}`);
  },

  confirm(jobId: string) {
    return webFetch<{ data: ImportJobDto }>(
      `/api/bff/imports/${jobId}/confirm`,
      { method: "POST" },
    );
  },
};
