import type { INestApplication } from "@nestjs/common";

import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { JobsRepository } from "../src/modules/jobs/jobs.repository";
import { AppExceptionFilter } from "../src/shared/app-exception.filter";

process.env.DATABASE_URL = "postgresql://unused";
process.env.JWT_ACCESS_SECRET = "0123456789012345678901234567890123";
process.env.JWT_ACCESS_TTL = "15m";
process.env.JWT_REFRESH_TTL = "30d";

const token = (role: "USER" | "ADMIN") =>
  jwt.sign({ role }, process.env.JWT_ACCESS_SECRET as string, {
    subject: "55555555-5555-4555-8555-555555555555",
    expiresIn: "15m",
  });

interface JobRowLike {
  id: string;
  type: string;
  payload: unknown;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  result: unknown;
  runAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

class InMemoryJobsRepository {
  readonly rows: JobRowLike[] = [];

  async enqueue(input: { type: string; payload?: unknown }) {
    const now = new Date();
    const row: JobRowLike = {
      id: crypto.randomUUID(),
      type: input.type,
      payload: input.payload ?? {},
      status: "PENDING",
      attempts: 0,
      maxAttempts: 5,
      lastError: null,
      result: null,
      runAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.rows.push(row);
    return row;
  }

  async list(input: { page: number; limit: number; status?: string }) {
    const filtered = input.status
      ? this.rows.filter((row) => row.status === input.status)
      : this.rows;

    return {
      rows: filtered.slice((input.page - 1) * input.limit, input.page * input.limit),
      total: filtered.length,
    };
  }

  async findById(id: string) {
    return this.rows.find((row) => row.id === id) ?? null;
  }
}

describe("jobs (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(JobsRepository)
      .useValue(new InMemoryJobsRepository())
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

  const asAdmin = (method: "get" | "post", path: string) =>
    request(app.getHttpServer())
      [method](`/api/v1${path}`)
      .set("authorization", `Bearer ${token("ADMIN")}`);

  it("enqueues, lists and reads a job", async () => {
    const created = await asAdmin("post", "/jobs")
      .send({ type: "demo.echo", payload: { hello: "lean" } })
      .expect(201);

    const job = created.body.data;
    expect(job.status).toBe("PENDING");
    expect(job.attempts).toBe(0);

    const list = await asAdmin("get", "/jobs?page=1&limit=10").expect(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.meta.totalPages).toBe(1);

    const one = await asAdmin("get", `/jobs/${job.id}`).expect(200);
    expect(one.body.data.type).toBe("demo.echo");
  });

  it("rejects an unknown job type", async () => {
    const response = await asAdmin("post", "/jobs").send({ type: "nope" }).expect(400);

    expect(response.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects a non-admin token and an unknown job", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/jobs")
      .set("authorization", `Bearer ${token("USER")}`)
      .expect(403);

    await asAdmin("get", `/jobs/${crypto.randomUUID()}`).expect(404);
  });
});
