import type { INestApplication } from "@nestjs/common";

import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { FilesRepository, type CreateFileInput } from "../src/modules/files/files.repository";
import { AppExceptionFilter } from "../src/shared/app-exception.filter";
import { STORAGE, type StoragePort } from "../src/shared/storage/storage.port";

process.env.DATABASE_URL = "postgresql://unused";
process.env.JWT_ACCESS_SECRET = "0123456789012345678901234567890123";
process.env.JWT_ACCESS_TTL = "15m";
process.env.JWT_REFRESH_TTL = "30d";
process.env.MAX_UPLOAD_BYTES = "10";
process.env.STORAGE_DIR = "/tmp/lean-storage-test";

const token = jwt.sign({ role: "ADMIN" }, process.env.JWT_ACCESS_SECRET as string, {
  subject: "44444444-4444-4444-8444-444444444444",
  expiresIn: "15m",
});

class InMemoryStorage implements StoragePort {
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

  async create(input: CreateFileInput) {
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(FilesRepository)
      .useValue(repository)
      .overrideProvider(STORAGE)
      .useValue(storage)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const auth = (method: "get" | "post", path: string) =>
    request(app.getHttpServer())[method](`/api/v1${path}`).set("authorization", `Bearer ${token}`);

  it("uploads a file, returns metadata and streams it back", async () => {
    const payload = Buffer.from("hello lean");

    const created = await auth("post", "/files")
      .attach("file", payload, { filename: "note.txt", contentType: "text/plain" })
      .expect(201);

    const file = created.body.data;
    expect(file.originalName).toBe("note.txt");
    expect(file.sizeBytes).toBe(payload.length);
    expect(file.downloadUrl).toBe(`/api/v1/files/${file.id}/download`);

    const meta = await auth("get", `/files/${file.id}`).expect(200);
    expect(meta.body.data.mimeType).toBe("text/plain");

    const download = await auth("get", `/files/${file.id}/download`)
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

  it("rejects a disallowed mime type", async () => {
    const response = await auth("post", "/files")
      .attach("file", Buffer.from("PK"), {
        filename: "archive.zip",
        contentType: "application/zip",
      })
      .expect(415);

    expect(response.body.error.code).toBe("FILE_TYPE_NOT_ALLOWED");
  });

  it("rejects an oversized upload", async () => {
    const response = await auth("post", "/files")
      .attach("file", Buffer.alloc(50, "a"), { filename: "big.txt", contentType: "text/plain" })
      .expect(413);

    expect(response.body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("returns 404 for an unknown file and 401 without a token", async () => {
    await auth("get", `/files/${crypto.randomUUID()}`).expect(404);
    await request(app.getHttpServer()).get(`/api/v1/files/${crypto.randomUUID()}`).expect(401);
  });
});
