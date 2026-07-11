import type {
  FileDto,
  FileHistoryEventDto,
  FileVersionDto,
  ListResponse,
} from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export interface FilesParams {
  search?: string;
  mimeFilter?: string;
  page: number;
}

export async function fetchFiles(params: FilesParams) {
  const path = buildPath("/api/bff/admin/files", {
    limit: 50,
    page: params.page,
    search: params.search,
    mimeType: params.mimeFilter,
  });
  return webFetch<ListResponse<FileDto>>(path);
}

export async function fetchFileVersions(fileId: string) {
  return webFetch<{ data: FileVersionDto[] }>(
    `/api/bff/admin/files/${fileId}/versions`,
  );
}

export async function fetchFileHistory(fileId: string) {
  return webFetch<{ data: FileHistoryEventDto[] }>(
    `/api/bff/admin/files/${fileId}/history`,
  );
}

export async function deleteFile(fileId: string) {
  return webFetch(`/api/bff/admin/files/${fileId}`, { method: "DELETE" });
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return webFetch("/api/bff/admin/files", {
    method: "POST",
    body: formData,
  });
}

export async function uploadVersion(fileId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return webFetch(`/api/bff/admin/files/${fileId}/versions`, {
    method: "POST",
    body: formData,
  });
}

export async function getFileDownloadUrl(fileId: string) {
  const res = await webFetch<{ data: { url: string } }>(
    `/api/bff/admin/files/${fileId}/url`,
  );
  return res.data.url;
}
