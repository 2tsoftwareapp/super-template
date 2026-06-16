export type UploadInput = {
  key: string;
  body: Buffer;
  mimeType: string;
};

export type UploadResult = {
  key: string;
};

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface ObjectStorage {
  upload(input: UploadInput): Promise<UploadResult>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
