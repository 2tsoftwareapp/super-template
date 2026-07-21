import type { JsonObject } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

export interface FileRecord {
  id: string;
  organizationId: string | null;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string | null;
  latestVersion: number;
  kind: string;
  visibility: string;
  uploadedById: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFileInput {
  organizationId?: string | null;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string | null;
  latestVersion?: number;
  kind?: string;
  visibility?: string;
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
  organizationId?: string | null;
  page: number;
  limit: number;
  search?: string;
  mimeType?: string;
  uploadedById?: string;
  from?: string;
  to?: string;
  includeDeleted?: boolean;
  excludeKinds?: string[];
  excludeVisibilities?: string[];
  sortField: 'createdAt' | 'originalName' | 'sizeBytes';
  sortOrder: 'asc' | 'desc';
}

export interface FileListResult {
  rows: FileRecord[];
  total: number;
}

export interface FilesRepositoryPort {
  create(values: CreateFileInput, executor?: TransactionExecutor): Promise<FileRecord | null>;
  findById(fileId: string, executor?: TransactionExecutor): Promise<FileRecord | null>;
  softDelete(fileId: string, executor?: TransactionExecutor): Promise<FileRecord | null>;
  listSoftDeleted(limit: number, executor?: TransactionExecutor): Promise<FileRecord[]>;
  list(params: ListFilesQuery, executor?: TransactionExecutor): Promise<FileListResult>;
  setCurrentVersion(fileId: string, values: SetCurrentVersionInput, executor?: TransactionExecutor): Promise<FileRecord | null>;
  createVersion(values: CreateFileVersionInput, executor?: TransactionExecutor): Promise<FileVersionRecord>;
  listVersions(fileId: string, executor?: TransactionExecutor): Promise<FileVersionRecord[]>;
  findBatchOperationByIdempotencyKey(actorId: string, idempotencyKey: string, executor?: TransactionExecutor): Promise<FileBatchOperationRecord | null>;
  createBatchOperation(values: CreateFileBatchOperationInput, executor?: TransactionExecutor): Promise<FileBatchOperationRecord>;
}

export const FILES_REPOSITORY = Symbol('FILES_REPOSITORY');
