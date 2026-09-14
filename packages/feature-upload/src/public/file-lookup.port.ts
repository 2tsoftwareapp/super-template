export interface FileOwnerRecord {
  id: string;
  uploadedById: string;
}

export interface FileLookup {
  findById(fileId: string): Promise<FileOwnerRecord | null>;
}

export { FILE_LOOKUP } from "./file-lookup.token";
