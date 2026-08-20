import { bffPath } from "@repo/api-contract";

import type { FileDto, FileHistoryEventDto, FileVersionDto, ListResponse } from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export interface FilesParams {
  search?: string | undefined;
  mimeFilter?: string | undefined;
  page: number;
  sortField?: "createdAt" | "originalName" | "sizeBytes" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
}

/**
 * Files transport layer. Paths come from OpenAPI via `bffPath` (§22).
 */
export const filesApi = {
  list(params: FilesParams) {
    const path = buildPath(bffPath("/api/v1/files"), {
      limit: 50,
      page: params.page,
      search: params.search,
      mimeType: params.mimeFilter,
      sortField: params.sortField,
      sortOrder: params.sortOrder,
    });
    return webFetch<ListResponse<FileDto>>(path);
  },

  versions(fileId: string) {
    return webFetch<{ data: FileVersionDto[] }>(
      bffPath("/api/v1/files/{id}/versions", { id: fileId }),
    );
  },

  history(fileId: string) {
    return webFetch<{ data: FileHistoryEventDto[] }>(
      bffPath("/api/v1/files/{id}/history", { id: fileId }),
    );
  },

  delete(fileId: string) {
    return webFetch(bffPath("/api/v1/files/{id}", { id: fileId }), {
      method: "DELETE",
    });
  },

  upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return webFetch(bffPath("/api/v1/files"), {
      method: "POST",
      body: formData,
    });
  },

  uploadVersion(fileId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return webFetch(bffPath("/api/v1/files/{id}/versions", { id: fileId }), {
      method: "POST",
      body: formData,
    });
  },

  getDownloadUrl(fileId: string) {
    return webFetch<{ data: { url: string } }>(
      bffPath("/api/v1/files/{id}/url", { id: fileId }),
    ).then((res) => res.data.url);
  },
};
