import type { INestApplication } from "@nestjs/common";

import { Test, type TestingModuleBuilder } from "@nestjs/testing";
import { hashPassword, type UserRow } from "@lean/db";
import jwt from "jsonwebtoken";

import { configureApp } from "../src/app-setup";
import { AppModule } from "../src/app.module";
import { AuthRepository, type CreateSessionInput } from "../src/modules/auth/auth.repository";
import { DatabaseService } from "../src/shared/database.service";

process.env.DATABASE_URL = "postgresql://unused";
process.env.JWT_ACCESS_SECRET = "0123456789012345678901234567890123";
process.env.JWT_ACCESS_TTL = "15m";
process.env.JWT_REFRESH_TTL = "30d";

export const PASSWORD = "ChangeMe123!";
export const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
export const MEMBER_ID = "22222222-2222-4222-8222-222222222222";

const passwordHash = hashPassword(PASSWORD);

export function makeUser(overrides: Partial<UserRow> = {}): UserRow {
  const now = new Date();

  return {
    id: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@example.local`,
    passwordHash,
    displayName: "Member",
    role: "USER",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** A token as the API signs it; the guard still reads role and status from the repository. */
export const signToken = (userId: string): string =>
  jwt.sign({ role: "USER" }, process.env.JWT_ACCESS_SECRET ?? "", {
    algorithm: "HS256",
    subject: userId,
    expiresIn: "15m",
  });

interface SessionRecord extends CreateSessionInput {
  id: string;
  revokedAt: Date | null;
}

/** Same contract as AuthRepository, in memory: the e2e tests the HTTP surface. */
export class InMemoryAuthRepository {
  readonly users = new Map<string, UserRow>();
  readonly sessions = new Map<string, SessionRecord>();

  constructor() {
    this.add(makeUser({ id: ADMIN_ID, email: "admin@example.local", role: "ADMIN" }));
    this.add(makeUser({ id: MEMBER_ID, email: "member@example.local" }));
  }

  add(user: UserRow): UserRow {
    this.users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async createSession(input: CreateSessionInput) {
    const id = crypto.randomUUID();
    this.sessions.set(input.refreshTokenHash, { ...input, id, revokedAt: null });
  }

  async findSessionByHash(refreshTokenHash: string) {
    return this.sessions.get(refreshTokenHash) ?? null;
  }

  async rotateSession(sessionId: string, next: CreateSessionInput) {
    const current = [...this.sessions.values()].find((session) => session.id === sessionId);

    if (!current || current.revokedAt) {
      return "lost-race" as const;
    }

    current.revokedAt = new Date();

    if (this.users.get(next.userId)?.status !== "ACTIVE") {
      return "inactive" as const;
    }

    await this.createSession(next);
    return "rotated" as const;
  }

  async revokeSessionByHash(hash: string) {
    const session = this.sessions.get(hash);
    if (session && !session.revokedAt) session.revokedAt = new Date();
  }

  async revokeAllForUser(userId: string) {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.revokedAt) session.revokedAt = new Date();
    }
  }
}

/** Repositories are replaced in memory, so a transaction is just the work itself. */
export const passThroughDatabase = {
  db: {},
  transaction: <T>(work: () => Promise<T>): Promise<T> => work(),
  ping: async (): Promise<void> => undefined,
};

export async function createTestApp(
  override: (builder: TestingModuleBuilder) => TestingModuleBuilder = (builder) => builder,
  auth: InMemoryAuthRepository = new InMemoryAuthRepository(),
): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AuthRepository)
    .useValue(auth)
    .overrideProvider(DatabaseService)
    .useValue(passThroughDatabase);
  const moduleRef = await override(builder).compile();
  const app = moduleRef.createNestApplication();

  configureApp(app);
  await app.init();

  return app;
}

/** What node-postgres raises (wrapped by Drizzle) when a constraint rejects a write. */
export function constraintError(sqlState: string): Error {
  return new Error("Failed query", {
    cause: Object.assign(new Error("violation"), { code: sqlState }),
  });
}
