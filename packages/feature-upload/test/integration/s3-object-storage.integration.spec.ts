import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { S3ObjectStorage } from "../../src/storage/infrastructure/s3-object-storage.service";

const enabled = process.env.RUN_S3_INTEGRATION === "1";
const values = {
  S3_BUCKET: process.env.S3_BUCKET ?? "super-template-uploads",
  S3_REGION: process.env.S3_REGION ?? "us-east-1",
  S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://localhost:9000",
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ?? "minioadmin",
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ?? "minioadminsecret",
};

describe.skipIf(!enabled)("S3ObjectStorage with MinIO", () => {
  it("round-trips an object through the real S3-compatible service", async () => {
    const storage = new S3ObjectStorage({ values } as never);
    const key = `integration/${randomUUID()}.txt`;
    const body = Buffer.from("real-minio-payload");

    try {
      await expect(storage.upload({ key, body, mimeType: "text/plain" })).resolves.toEqual({ key });
      await expect(storage.read(key)).resolves.toEqual(body);
      await expect(storage.getSignedUrl(key, 60)).resolves.toContain("X-Amz-Signature=");
    } finally {
      await storage.delete(key);
    }

    await expect(storage.read(key)).rejects.toBeDefined();
  }, 30_000);
});
