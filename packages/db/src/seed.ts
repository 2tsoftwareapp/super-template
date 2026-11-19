import { eq } from "drizzle-orm";

import { loadEnv } from "@lean/config";
import { createDatabase } from "./client";
import { hashPassword } from "./password";
import { users } from "./schema";

const email = (process.env.ADMIN_EMAIL ?? "admin@example.local").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

async function main(): Promise<void> {
  const { db, pool } = createDatabase(loadEnv().DATABASE_URL);

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existing) {
      console.log(`admin already exists: ${email}`);
      return;
    }

    await db.insert(users).values({
      email,
      passwordHash: hashPassword(password),
      displayName: "Admin",
      role: "ADMIN",
    });

    console.log(`admin created: ${email}`);
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
