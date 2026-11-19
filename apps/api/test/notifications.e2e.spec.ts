import type { INestApplication } from "@nestjs/common";

import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { NotificationsRepository } from "../src/modules/notifications/notifications.repository";
import { AppExceptionFilter } from "../src/shared/app-exception.filter";

process.env.DATABASE_URL = "postgresql://unused";
process.env.JWT_ACCESS_SECRET = "0123456789012345678901234567890123";
process.env.JWT_ACCESS_TTL = "15m";
process.env.JWT_REFRESH_TTL = "30d";

const USER_A = "66666666-6666-4666-8666-666666666666";
const USER_B = "77777777-7777-4777-8777-777777777777";

const token = (sub: string, role: "USER" | "ADMIN") =>
  jwt.sign({ role }, process.env.JWT_ACCESS_SECRET as string, { subject: sub, expiresIn: "15m" });

interface Row {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}

class InMemoryNotificationsRepository {
  readonly rows: Row[] = [];

  async create(input: { userId: string; type: string; title: string; body: string }) {
    const row: Row = { id: crypto.randomUUID(), readAt: null, createdAt: new Date(), ...input };
    this.rows.push(row);
    return row;
  }

  async listForUser(userId: string, page: number, limit: number) {
    const mine = this.rows.filter((row) => row.userId === userId);

    return {
      rows: mine.slice((page - 1) * limit, page * limit),
      total: mine.length,
      unread: mine.filter((row) => row.readAt === null).length,
    };
  }

  async markRead(id: string, userId: string) {
    const row = this.rows.find((entry) => entry.id === id && entry.userId === userId);

    if (!row) return null;

    row.readAt = new Date();
    return row;
  }
}

describe("notifications (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const repository = new InMemoryNotificationsRepository();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(NotificationsRepository)
      .useValue(repository)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();

    await request(app.getHttpServer())
      .post("/api/v1/notifications")
      .set("authorization", `Bearer ${token(USER_A, "ADMIN")}`)
      .send({ userId: USER_A, type: "test", title: "Hello", body: "First" })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it("lists only the current user's notifications with an unread count", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("authorization", `Bearer ${token(USER_A, "USER")}`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.unread).toBe(1);

    const other = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("authorization", `Bearer ${token(USER_B, "USER")}`)
      .expect(200);

    expect(other.body.data).toHaveLength(0);
  });

  it("marks a notification read and refuses someone else's row", async () => {
    const list = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set("authorization", `Bearer ${token(USER_A, "USER")}`)
      .expect(200);

    const id = list.body.data[0].id;

    const marked = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${id}/read`)
      .set("authorization", `Bearer ${token(USER_A, "USER")}`)
      .expect(200);

    expect(marked.body.data.readAt).not.toBeNull();

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${id}/read`)
      .set("authorization", `Bearer ${token(USER_B, "USER")}`)
      .expect(404);
  });

  it("only lets an admin create a notification", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/notifications")
      .set("authorization", `Bearer ${token(USER_A, "USER")}`)
      .send({ userId: USER_A, type: "test", title: "x", body: "y" })
      .expect(403);

    await request(app.getHttpServer())
      .post("/api/v1/notifications")
      .set("authorization", `Bearer ${token(USER_A, "ADMIN")}`)
      .send({ userId: USER_A, title: "missing body" })
      .expect(400);
  });
});
