import type { INestApplication } from "@nestjs/common";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { JobsRepository } from "../src/modules/jobs/jobs.repository";
import { ADMIN_ID, MEMBER_ID, createTestApp, signToken } from "./support";

const token = (role: "USER" | "ADMIN") => signToken(role === "ADMIN" ? ADMIN_ID : MEMBER_ID);

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
    app = await createTestApp((builder) => builder.overrideProvider(JobsRepository).useValue(jobs));
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
