import type { INestApplication } from "@nestjs/common";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { FilesRepository, type CreateFileInput } from "../src/modules/files/files.repository";
import { LocalStorageService } from "../src/shared/storage/local-storage.service";
import {
  ADMIN_ID,
  InMemoryAuthRepository,
  MEMBER_ID,
  createTestApp,
  makeUser,
  signToken,
} from "./support";

process.env.MAX_UPLOAD_BYTES = "10";
process.env.STORAGE_DIR = "/tmp/lean-storage-test";

class InMemoryStorage {
  readonly objects = new Map<string, Buffer>();

  async put(key: string, data: Buffer): Promise<void> {
    this.objects.set(key, Buffer.from(data));
  }

  async read(key: string): Promise<Buffer> {
    const data = this.objects.get(key);
    if (!data) throw new Error(`missing object ${key}`);
    return data;
  }

  async remove(key: string): Promise<void> {
    this.objects.delete(key);
  }
}

class InMemoryFilesRepository {
  readonly rows: Array<CreateFileInput & { id: string; createdAt: Date }> = [];
  failNextInsert = false;

  async create(input: CreateFileInput) {
    if (this.failNextInsert) {
      this.failNextInsert = false;
      throw new Error("insert failed");
    }

    const row = { id: crypto.randomUUID(), createdAt: new Date(), ...input };
    this.rows.push(row);
    return row;
  }

  async findById(id: string) {
    return this.rows.find((row) => row.id === id) ?? null;
  }
}

describe("files (e2e)", () => {
  let app: INestApplication;
  const storage = new InMemoryStorage();
  const repository = new InMemoryFilesRepository();
  const auth = new InMemoryAuthRepository();
  const stranger = auth.add(makeUser());

  beforeAll(async () => {
    app = await createTestApp(
      (builder) =>
        builder
          .overrideProvider(FilesRepository)
          .useValue(repository)
          .overrideProvider(LocalStorageService)
          .useValue(storage),
      auth,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (userId: string, method: "get" | "post", path: string) =>
    request(app.getHttpServer())
      [method](`/api/v1${path}`)
      .set("authorization", `Bearer ${signToken(userId)}`);

  const upload = (userId: string, content: Buffer, filename = "note.txt") =>
    as(userId, "post", "/files").attach("file", content, { filename, contentType: "text/plain" });

  it("uploads a file, returns metadata and streams it back to the owner", async () => {
    const payload = Buffer.from("hello lean");
    const file = (await upload(MEMBER_ID, payload).expect(201)).body.data;

    expect(file.originalName).toBe("note.txt");
    expect(file.sizeBytes).toBe(payload.length);
    expect(file.downloadUrl).toBe(`/api/v1/files/${file.id}/download`);

    const meta = await as(MEMBER_ID, "get", `/files/${file.id}`).expect(200);
    expect(meta.body.data.mimeType).toBe("text/plain");

    const download = await as(MEMBER_ID, "get", `/files/${file.id}/download`)
      .buffer(true)
      .parse((response, done) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(download.headers["content-disposition"]).toContain("note.txt");
    expect(Buffer.from(download.body as Buffer).toString()).toBe("hello lean");
  });

  it("hides a file from other users but not from an admin", async () => {
    const file = (await upload(MEMBER_ID, Buffer.from("private")).expect(201)).body.data;

    const denied = await as(stranger.id, "get", `/files/${file.id}/download`).expect(404);
    expect(denied.body.error.code).toBe("FILE_NOT_FOUND");
    await as(stranger.id, "get", `/files/${file.id}`).expect(404);

    await as(ADMIN_ID, "get", `/files/${file.id}`).expect(200);
  });

  it("rejects a disallowed mime type", async () => {
    const response = await as(MEMBER_ID, "post", "/files")
      .attach("file", Buffer.from("PK"), {
        filename: "archive.zip",
        contentType: "application/zip",
      })
      .expect(415);

    expect(response.body.error.code).toBe("FILE_TYPE_NOT_ALLOWED");
  });

  it("rejects an oversized upload while streaming", async () => {
    const response = await upload(MEMBER_ID, Buffer.alloc(50, "a"), "big.txt").expect(413);

    expect(response.body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("deletes the stored bytes when the metadata insert fails", async () => {
    const before = storage.objects.size;
    repository.failNextInsert = true;

    await upload(MEMBER_ID, Buffer.from("orphan")).expect(500);

    expect(storage.objects.size).toBe(before);
  });

  it("returns 404 for an unknown file and 401 without a token", async () => {
    await as(MEMBER_ID, "get", `/files/${crypto.randomUUID()}`).expect(404);
    await request(app.getHttpServer()).get(`/api/v1/files/${crypto.randomUUID()}`).expect(401);
  });
});
