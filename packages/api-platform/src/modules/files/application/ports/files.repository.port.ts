import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

export interface FileRecord {
  id: string;
  organizationId: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  latestVersion: number;
  uploadedById: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFileInput {
  organizationId: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string | null;
  latestVersion?: number;
  uploadedById: string | null;
}

export interface SetCurrentVersionInput {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  latestVersion: number;
}

export interface FileVersionRecord {
  id: string;
  fileId: string;
  organizationId: string;
  versionNumber: number;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  createdById: string | null;
  createdAt: Date;
}

export interface CreateFileVersionInput {
  fileId: string;
  organizationId: string;
  versionNumber: number;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  createdById: string | null;
}

export interface FileBatchOperationRecord {
  id: string;
  organizationId: string;
  actorId: string | null;
  operation: string;
  idempotencyKey: string | null;
  results: JsonObject[];
  createdAt: Date;
}

export interface CreateFileBatchOperationInput {
  organizationId: string;
  actorId: string;
  operation: string;
  idempotencyKey: string | null;
  results: JsonObject[];
}

export interface ListFilesQuery {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  mimeType?: string;
  uploadedById?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
  sortField: 'createdAt' | 'originalName' | 'sizeBytes';
  sortOrder: 'asc' | 'desc';
}

export interface FileListResult {
  rows: FileRecord[];
  total: number;
}

export interface FilesRepositoryPort {
  create(values: CreateFileInput, executor?: DatabaseExecutor): Promise<FileRecord | null>;
  findById(fileId: string, executor?: DatabaseExecutor): Promise<FileRecord | null>;
  softDelete(fileId: string, executor?: DatabaseExecutor): Promise<FileRecord | null>;
  listSoftDeleted(limit: number, executor?: DatabaseExecutor): Promise<FileRecord[]>;
  list(params: ListFilesQuery, executor?: DatabaseExecutor): Promise<FileListResult>;
  setCurrentVersion(fileId: string, values: SetCurrentVersionInput, executor?: DatabaseExecutor): Promise<FileRecord | null>;
  createVersion(values: CreateFileVersionInput, executor?: DatabaseExecutor): Promise<FileVersionRecord>;
  listVersions(fileId: string, executor?: DatabaseExecutor): Promise<FileVersionRecord[]>;
  findBatchOperationByIdempotencyKey(actorId: string, idempotencyKey: string, executor?: DatabaseExecutor): Promise<FileBatchOperationRecord | null>;
  createBatchOperation(values: CreateFileBatchOperationInput, executor?: DatabaseExecutor): Promise<FileBatchOperationRecord>;
}

export const FILES_REPOSITORY = Symbol('FILES_REPOSITORY');
