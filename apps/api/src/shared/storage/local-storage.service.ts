import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { Injectable } from "@nestjs/common";
import { loadEnv } from "@lean/config";

/** Object storage on local disk. Extract an interface when a second driver (S3) lands. */
@Injectable()
export class LocalStorageService {
  private readonly root = resolve(loadEnv().STORAGE_DIR);

  /** Keys are generated internally, but never trust a path that reaches the disk. */
  private pathFor(key: string): string {
    const full = resolve(join(this.root, key));

    if (!full.startsWith(`${this.root}/`)) {
      throw new Error(`Storage key escapes the root: ${key}`);
    }

    return full;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const path = this.pathFor(key);

    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key));
  }

  async remove(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}
