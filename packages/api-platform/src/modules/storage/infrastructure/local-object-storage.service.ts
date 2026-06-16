import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core/config/environment.service';
import type {
  ObjectStorage,
  UploadInput,
  UploadResult,
} from '../application/object-storage.interface';

@Injectable()
export class LocalObjectStorage implements ObjectStorage {
  constructor(private readonly environmentService: EnvironmentService) {}

  private get basePath(): string {
    return this.environmentService.values.STORAGE_LOCAL_PATH;
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const filePath = join(this.basePath, input.key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, input.body);

    return { key: input.key };
  }

  async read(key: string): Promise<Buffer> {
    const filePath = join(this.basePath, key);
    return readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.basePath, key);

    try {
      await unlink(filePath);
    } catch {
      // Ignore missing files during cleanup.
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    const filePath = join(this.basePath, key);
    await readFile(filePath);
    const baseUrl = this.environmentService.values.API_INTERNAL_URL.replace(
      /\/$/,
      '',
    );
    return `${baseUrl}/storage/local/${encodeURIComponent(key)}`;
  }
}
