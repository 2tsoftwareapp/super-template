import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, afterEach } from "vitest";
import { LocalObjectStorage } from "../../src/storage/infrastructure/local-object-storage.service";

describe("LocalObjectStorage integration", () => {
  const directories: string[] = [];

  afterEach(async () => {
    await Promise.all(
      directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
    );
  });

  it("persists, reads, signs, and deletes an object on the filesystem", async () => {
    const basePath = await mkdtemp(join(tmpdir(), "feature-upload-"));
    directories.push(basePath);
    const storage = new LocalObjectStorage({
      values: {
        STORAGE_LOCAL_PATH: basePath,
        API_INTERNAL_URL: "http://localhost:3000/",
      },
    } as never);

    await storage.upload({ key: "tenant/file.txt", body: Buffer.from("payload") });

    await expect(storage.read("tenant/file.txt")).resolves.toEqual(Buffer.from("payload"));
    await expect(storage.getSignedUrl("tenant/file.txt")).resolves.toBe(
      "http://localhost:3000/storage/local/tenant%2Ffile.txt",
    );

    await storage.delete("tenant/file.txt");
    await expect(storage.read("tenant/file.txt")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(storage.delete("tenant/file.txt")).resolves.toBeUndefined();
  });
});
