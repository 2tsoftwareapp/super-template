import type { INestApplication } from "@nestjs/common";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { NotificationsRepository } from "../src/modules/notifications/notifications.repository";
import {
  ADMIN_ID,
  InMemoryAuthRepository,
  constraintError,
  createTestApp,
  makeUser,
  signToken,
} from "./support";

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

  constructor(private readonly knownUsers: Set<string>) {}

  async create(input: { userId: string; type: string; title: string; body: string }) {
    if (!this.knownUsers.has(input.userId)) {
      throw constraintError("23503");
    }

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
  const auth = new InMemoryAuthRepository();
  const userA = auth.add(makeUser()).id;
  const userB = auth.add(makeUser()).id;

  const as = (userId: string, method: "get" | "post" | "patch", path: string) =>
    request(app.getHttpServer())
      [method](`/api/v1${path}`)
      .set("authorization", `Bearer ${signToken(userId)}`);

  beforeAll(async () => {
    const repository = new InMemoryNotificationsRepository(new Set(auth.users.keys()));

    app = await createTestApp(
      (builder) => builder.overrideProvider(NotificationsRepository).useValue(repository),
      auth,
    );

    await as(ADMIN_ID, "post", "/notifications")
      .send({ userId: userA, type: "test", title: "Hello", body: "First" })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it("lists only the current user's notifications with an unread count", async () => {
    const response = await as(userA, "get", "/notifications").expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.unread).toBe(1);

    const other = await as(userB, "get", "/notifications").expect(200);
    expect(other.body.data).toHaveLength(0);
  });

  it("marks a notification read and refuses someone else's row", async () => {
    const list = await as(userA, "get", "/notifications").expect(200);
    const id = list.body.data[0].id;

    const marked = await as(userA, "patch", `/notifications/${id}/read`).expect(200);
    expect(marked.body.data.readAt).not.toBeNull();

    await as(userB, "patch", `/notifications/${id}/read`).expect(404);
  });

  it("only lets an admin create a notification", async () => {
    await as(userA, "post", "/notifications")
      .send({ userId: userA, type: "test", title: "x", body: "y" })
      .expect(403);

    await as(ADMIN_ID, "post", "/notifications")
      .send({ userId: userA, title: "missing body" })
      .expect(400);
  });

  it("rejects a malformed or unknown recipient without a 500", async () => {
    const malformed = await as(ADMIN_ID, "post", "/notifications")
      .send({ userId: "nope", type: "t", title: "x", body: "y" })
      .expect(400);
    expect(malformed.body.error.code).toBe("VALIDATION_FAILED");

    const unknown = await as(ADMIN_ID, "post", "/notifications")
      .send({ userId: crypto.randomUUID(), type: "t", title: "x", body: "y" })
      .expect(404);
    expect(unknown.body.error.code).toBe("USER_NOT_FOUND");
  });
});
