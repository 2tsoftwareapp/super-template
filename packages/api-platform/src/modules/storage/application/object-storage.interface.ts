export interface UploadInput {
  key: string;
  body: Buffer;
  mimeType: string;
}

export interface UploadResult {
  key: string;
}

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface ObjectStorage {
  upload(input: UploadInput): Promise<UploadResult>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
