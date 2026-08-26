export interface FileOwnerRecord {
  id: string;
  uploadedById: string;
}

export interface FileLookup {
  findById(fileId: string): Promise<FileOwnerRecord | null>;
}

export const FILE_LOOKUP = Symbol("FILE_LOOKUP");
