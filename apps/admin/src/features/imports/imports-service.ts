import type { ImportJobDto } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export interface CreateImportInput {
  fileId: string;
  type: string;
}

export async function createImportJob(input: CreateImportInput) {
  return webFetch<{ data: ImportJobDto }>("/api/bff/imports", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchImportJob(jobId: string) {
  return webFetch<{ data: ImportJobDto }>(`/api/bff/imports/${jobId}`);
}

export async function confirmImportJob(jobId: string) {
  return webFetch<{ data: ImportJobDto }>(`/api/bff/imports/${jobId}/confirm`, {
    method: "POST",
  });
}
