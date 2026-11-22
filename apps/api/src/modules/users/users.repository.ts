import { Injectable, Inject } from "@nestjs/common";
import { asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { users, type UserRow } from "@lean/db";

import { DatabaseService } from "../../shared/database.service";

export interface ListUsersInput {
  page: number;
  limit: number;
  search?: string;
}

/** `%` and `_` in a search term are literals, not wildcards (backslash is the default escape). */
const escapeLike = (term: string): string => term.replace(/[\\%_]/g, "\\$&");

@Injectable()
export class UsersRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(input: ListUsersInput): Promise<{ rows: UserRow[]; total: number }> {
    const pattern = input.search ? `%${escapeLike(input.search)}%` : undefined;
    const where = pattern
      ? or(ilike(users.email, pattern), ilike(users.displayName, pattern))
      : undefined;

    const [rows, [totalRow]] = await Promise.all([
      this.database.db
        .select()
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt), asc(users.id))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit),
      this.database.db.select({ value: count() }).from(users).where(where),
    ]);

    return { rows, total: Number(totalRow?.value ?? 0) };
  }

  async findById(userId: string): Promise<UserRow | null> {
    const [user] = await this.database.db.select().from(users).where(eq(users.id, userId)).limit(1);

    return user ?? null;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const [user] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async create(values: typeof users.$inferInsert): Promise<UserRow> {
    const [user] = await this.database.db.insert(users).values(values).returning();

    if (!user) {
      throw new Error("User insert returned no row");
    }

    return user;
  }

  async update(
    userId: string,
    values: Partial<typeof users.$inferInsert>,
  ): Promise<UserRow | null> {
    const [user] = await this.database.db
      .update(users)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user ?? null;
  }

  async remove(userId: string): Promise<boolean> {
    const [deleted] = await this.database.db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    return Boolean(deleted);
  }
}
