/** Object storage boundary: filesystem today, S3-compatible later. */
export interface StoragePort {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

export const STORAGE = Symbol("STORAGE");
