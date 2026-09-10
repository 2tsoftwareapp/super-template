import { S3Client } from "@aws-sdk/client-s3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { S3ObjectStorage } from "../s3-object-storage.service";

const environment = {
  values: {
    S3_BUCKET: "uploads",
    S3_REGION: "us-east-1",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY_ID: "minio",
    S3_SECRET_ACCESS_KEY: "secret",
  },
};

describe("S3ObjectStorage provider boundary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps upload and delete operations to the configured bucket and key", async () => {
    const send = vi.spyOn(S3Client.prototype, "send").mockResolvedValue({} as never);
    const storage = new S3ObjectStorage(environment as never);

    await expect(
      storage.upload({ key: "org/file.txt", body: Buffer.from("data"), mimeType: "text/plain" }),
    ).resolves.toEqual({ key: "org/file.txt" });
    await expect(storage.delete("org/file.txt")).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      input: { Bucket: "uploads", Key: "org/file.txt", ContentType: "text/plain" },
    });
    expect(send.mock.calls[1]?.[0]).toMatchObject({
      input: { Bucket: "uploads", Key: "org/file.txt" },
    });
  });

  it("reads byte bodies and rejects an empty provider response", async () => {
    const send = vi.spyOn(S3Client.prototype, "send");
    const storage = new S3ObjectStorage(environment as never);
    send.mockResolvedValueOnce({
      Body: { transformToByteArray: async () => Uint8Array.from([1, 2, 3]) },
    } as never);
    await expect(storage.read("org/file.bin")).resolves.toEqual(Buffer.from([1, 2, 3]));
    send.mockResolvedValueOnce({ Body: undefined } as never);
    await expect(storage.read("org/missing.bin")).rejects.toThrow("S3 object body is empty");
  });
});
