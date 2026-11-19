import type { INestApplication } from "@nestjs/common";

import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { hashPassword, type UserRow } from "@lean/db";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { UsersRepository } from "../src/modules/users/users.repository";
import { AppExceptionFilter } from "../src/shared/app-exception.filter";

process.env.DATABASE_URL = "postgresql://unused";
process.env.JWT_ACCESS_SECRET = "0123456789012345678901234567890123";
process.env.JWT_ACCESS_TTL = "15m";
process.env.JWT_REFRESH_TTL = "30d";

const token = (role: "USER" | "ADMIN") =>
  jwt.sign({ role }, process.env.JWT_ACCESS_SECRET as string, {
    subject: "22222222-2222-4222-8222-222222222222",
    expiresIn: "15m",
  });

const baseUser = (overrides: Partial<UserRow> = {}): UserRow => {
  const now = new Date();

  return {
    id: "33333333-3333-4333-8333-333333333333",
    email: "member@example.local",
    passwordHash: hashPassword("ChangeMe123!"),
    displayName: "Member",
    role: "USER",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

class InMemoryUsersRepository {
  rows: UserRow[] = [baseUser()];

  async list(input: { page: number; limit: number; search?: string }) {
    const filtered = input.search
      ? this.rows.filter(
          (row) =>
            row.email.includes(input.search as string) ||
            row.displayName.includes(input.search as string),
        )
      : this.rows;

    return {
      rows: filtered.slice((input.page - 1) * input.limit, input.page * input.limit),
      total: filtered.length,
    };
  }

  async findById(id: string) {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async findByEmail(email: string) {
    return this.rows.find((row) => row.email === email) ?? null;
  }

  async create(values: Partial<UserRow>) {
    const user = baseUser({ id: crypto.randomUUID(), ...values } as Partial<UserRow>);
    this.rows.push(user);
    return user;
  }

  async update(id: string, values: Partial<UserRow>) {
    const row = this.rows.find((entry) => entry.id === id);
    if (!row) return null;
    Object.assign(row, values);
    return row;
  }

  async remove(id: string) {
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => row.id !== id);
    return this.rows.length < before;
  }
}

describe("users (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(UsersRepository)
      .useValue(new InMemoryUsersRepository())
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

  const asAdmin = (method: "get" | "post" | "patch" | "delete", path: string) =>
    request(app.getHttpServer())
      [method](`/api/v1${path}`)
      .set("authorization", `Bearer ${token("ADMIN")}`);

  it("rejects a non-admin token", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/users")
      .set("authorization", `Bearer ${token("USER")}`)
      .expect(403);
  });

  it("lists users with page metadata", async () => {
    const response = await asAdmin("get", "/users?page=1&limit=10").expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it("creates, updates, blocks and deletes a user", async () => {
    const created = await asAdmin("post", "/users")
      .send({
        email: "new@example.local",
        password: "ChangeMe123!",
        displayName: "New Person",
      })
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

  it("rejects a duplicate email with 409", async () => {
    const response = await asAdmin("post", "/users")
      .send({
        email: "member@example.local",
        password: "ChangeMe123!",
        displayName: "Duplicate",
      })
      .expect(409);

    expect(response.body.error.code).toBe("USER_EMAIL_TAKEN");
  });

  it("rejects an invalid payload with the shared validation envelope", async () => {
    const response = await asAdmin("post", "/users")
      .send({ email: "not-an-email", password: "short", displayName: "" })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_FAILED");
  });
});
