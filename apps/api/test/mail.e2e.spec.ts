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
    subject: "88888888-8888-4888-8888-888888888888",
    expiresIn: "15m",
  });

class InMemoryJobsRepository {
  readonly rows: Array<{ id: string; type: string; payload: unknown; status: string }> = [];

  async enqueue(input: { type: string; payload?: unknown }) {
    const row = {
      id: crypto.randomUUID(),
      type: input.type,
      payload: input.payload ?? {},
      status: "PENDING",
    };

    this.rows.push(row);
    return {
      ...row,
      attempts: 0,
      maxAttempts: 5,
      lastError: null,
      result: null,
      runAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

describe("mail (e2e)", () => {
  let app: INestApplication;
  const jobs = new InMemoryJobsRepository();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(JobsRepository)
      .useValue(jobs)
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

  it("enqueues a mail.send job instead of sending inside the request", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/mail/send")
      .set("authorization", `Bearer ${token("ADMIN")}`)
      .send({ to: "person@example.local", subject: "Hi", text: "Body" })
      .expect(202);

    expect(response.body.data.status).toBe("PENDING");
    expect(jobs.rows[0]?.type).toBe("mail.send");
    expect(jobs.rows[0]?.payload).toMatchObject({ to: "person@example.local" });
  });

  it("validates the payload and the role", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/mail/send")
      .set("authorization", `Bearer ${token("ADMIN")}`)
      .send({ to: "not-an-email", subject: "", text: "" })
      .expect(400);

    await request(app.getHttpServer())
      .post("/api/v1/mail/send")
      .set("authorization", `Bearer ${token("USER")}`)
      .send({ to: "person@example.local", subject: "Hi", text: "Body" })
      .expect(403);
  });
});
