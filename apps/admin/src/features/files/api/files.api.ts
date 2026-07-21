import type {
  FileDto,
  FileHistoryEventDto,
  FileVersionDto,
  ListResponse,
} from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export interface FilesParams {
  search?: string | undefined;
  mimeFilter?: string | undefined;
  page: number;
}

/**
 * Files transport layer. Paths match OpenAPI `/api/v1/files` via BFF.
 */
export const filesApi = {
  list(params: FilesParams) {
    const path = buildPath("/api/bff/files", {
      limit: 50,
      page: params.page,
      search: params.search,
      mimeType: params.mimeFilter,
    });
    return webFetch<ListResponse<FileDto>>(path);
  },

  versions(fileId: string) {
    return webFetch<{ data: FileVersionDto[] }>(
      `/api/bff/files/${fileId}/versions`,
    );
  },

  history(fileId: string) {
    return webFetch<{ data: FileHistoryEventDto[] }>(
      `/api/bff/files/${fileId}/history`,
    );
  },

  delete(fileId: string) {
    return webFetch(`/api/bff/files/${fileId}`, { method: "DELETE" });
  },

  upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return webFetch("/api/bff/files", {
      method: "POST",
      body: formData,
    });
  },

  uploadVersion(fileId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return webFetch(`/api/bff/files/${fileId}/versions`, {
      method: "POST",
      body: formData,
    });
  },

  getDownloadUrl(fileId: string) {
    return webFetch<{ data: { url: string } }>(
      `/api/bff/files/${fileId}/url`,
    ).then((res) => res.data.url);
  },
};
