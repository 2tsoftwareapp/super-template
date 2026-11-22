import type { INestApplication } from "@nestjs/common";
import type { UserRow } from "@lean/db";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { NotificationsService } from "../src/modules/notifications/notifications.service";
import { UsersRepository } from "../src/modules/users/users.repository";
import {
  ADMIN_ID,
  InMemoryAuthRepository,
  MEMBER_ID,
  constraintError,
  createTestApp,
  makeUser,
} from "./support";
import { signToken } from "./support";

/** Backed by the auth fixture's map so guard lookups and admin edits see one set of users. */
class InMemoryUsersRepository {
  constructor(private readonly users: Map<string, UserRow>) {}

  async list(input: { page: number; limit: number; search?: string }) {
    const rows = [...this.users.values()].filter(
      (row) =>
        !input.search || row.email.includes(input.search) || row.displayName.includes(input.search),
    );

    return {
      rows: rows.slice((input.page - 1) * input.limit, input.page * input.limit),
      total: rows.length,
    };
  }

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  /** Mirrors the unique index: the check happens at insert time, after an await. */
  async create(values: Partial<UserRow>) {
    await new Promise((resolve) => setImmediate(resolve));

    if ([...this.users.values()].some((row) => row.email === values.email)) {
      throw constraintError("23505");
    }

    const user = makeUser(values);
    this.users.set(user.id, user);
    return user;
  }

  async update(id: string, values: Partial<UserRow>) {
    const row = this.users.get(id);
    if (!row) return null;
    Object.assign(row, values);
    return row;
  }

  async remove(id: string) {
    return this.users.delete(id);
  }
}

describe("users (e2e)", () => {
  let app: INestApplication;
  const auth = new InMemoryAuthRepository();

  beforeAll(async () => {
    app = await createTestApp(
      (builder) =>
        builder
          .overrideProvider(UsersRepository)
          .useValue(new InMemoryUsersRepository(auth.users))
          // Creating a user also writes a welcome notification; keep the test off the DB.
          .overrideProvider(NotificationsService)
          .useValue({ create: async () => ({ id: "notification-1" }) }),
      auth,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (userId: string, method: "get" | "post" | "patch" | "delete", path: string) =>
    request(app.getHttpServer())
      [method](`/api/v1${path}`)
      .set("authorization", `Bearer ${signToken(userId)}`);
  const asAdmin = (method: "get" | "post" | "patch" | "delete", path: string) =>
    as(ADMIN_ID, method, path);

  it("rejects a non-admin token with AUTH_FORBIDDEN", async () => {
    const response = await as(MEMBER_ID, "get", "/users").expect(403);

    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("lists users with page metadata", async () => {
    const response = await asAdmin("get", "/users?page=1&limit=1").expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 1 });
  });

  it("creates, updates, blocks and deletes a user", async () => {
    const created = await asAdmin("post", "/users")
      .send({ email: "new@example.local", password: "ChangeMe123!", displayName: "New Person" })
      .expect(201);

    const userId = created.body.data.id;
    expect(created.body.data.role).toBe("USER");

    const updated = await asAdmin("patch", `/users/${userId}`)
      .send({ displayName: "Renamed" })
      .expect(200);
    expect(updated.body.data.displayName).toBe("Renamed");

    const blocked = await asAdmin("patch", `/users/${userId}/status`)
      .send({ status: "BLOCKED" })
      .expect(200);
    expect(blocked.body.data.status).toBe("BLOCKED");

    await asAdmin("delete", `/users/${userId}`).expect(204);
    await asAdmin("get", `/users/${userId}`).expect(404);
  });

  it("blocking a user revokes their refresh sessions and their access token", async () => {
    const target = auth.add(makeUser());
    await auth.createSession({
      userId: target.id,
      refreshTokenHash: "hash-1",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await asAdmin("patch", `/users/${target.id}/status`).send({ status: "BLOCKED" }).expect(200);

    expect(auth.sessions.get("hash-1")?.revokedAt).not.toBeNull();
    await as(target.id, "get", "/notifications").expect(401);
  });

  it("rejects a duplicate email with 409", async () => {
    const response = await asAdmin("post", "/users")
      .send({ email: "member@example.local", password: "ChangeMe123!", displayName: "Duplicate" })
      .expect(409);

    expect(response.body.error.code).toBe("USER_EMAIL_TAKEN");
  });

  it("turns a concurrent duplicate create into one 201 and one 409, never a 500", async () => {
    const create = () =>
      asAdmin("post", "/users").send({
        email: "race@example.local",
        password: "ChangeMe123!",
        displayName: "Race",
      });

    const statuses = (await Promise.all([create(), create()]))
      .map((response) => response.status)
      .sort();

    expect(statuses).toEqual([201, 409]);
  });

  it("stops an admin from blocking, deleting or demoting themselves", async () => {
    const block = await asAdmin("patch", `/users/${ADMIN_ID}/status`)
      .send({ status: "BLOCKED" })
      .expect(403);
    expect(block.body.error.code).toBe("USER_SELF_ACTION_FORBIDDEN");

    await asAdmin("delete", `/users/${ADMIN_ID}`).expect(403);
    await asAdmin("patch", `/users/${ADMIN_ID}`).send({ role: "USER" }).expect(403);
    await asAdmin("patch", `/users/${ADMIN_ID}`).send({ displayName: "Still Admin" }).expect(200);
  });

  it("rejects an invalid payload with the shared validation envelope", async () => {
    const response = await asAdmin("post", "/users")
      .send({ email: "not-an-email", password: "short", displayName: "" })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_FAILED");
  });
});
