import { bffPath } from "@repo/api-contract";

import type { ImportJobDto } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export interface CreateImportInput {
  fileId: string;
  type: string;
}

/**
 * Imports transport layer. Paths from OpenAPI via `bffPath` (§22).
 */
export const importsApi = {
  create(input: CreateImportInput) {
    return webFetch<{ data: ImportJobDto }>(bffPath("/api/v1/imports"), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  get(jobId: string) {
    return webFetch<{ data: ImportJobDto }>(bffPath("/api/v1/imports/{id}", { id: jobId }));
  },

  confirm(jobId: string) {
    return webFetch<{ data: ImportJobDto }>(
      bffPath("/api/v1/imports/{id}/confirm", { id: jobId }),
      { method: "POST" },
    );
  },
};
