import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "../shared/timestamps";
import { users } from "./users";

export const userTwoFactorSecrets = pgTable("m_user_two_factor_secrets", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  // AES-256-GCM ciphertext/iv/authTag, all base64. The TOTP secret itself is never
  // stored in plaintext; the encryption key lives outside the database (env var).
  secretCiphertext: text("secret_ciphertext").notNull(),
  secretIv: text("secret_iv").notNull(),
  secretAuthTag: text("secret_auth_tag").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  ...timestamps,
});

export const userRecoveryCodes = pgTable(
  "t_user_recovery_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("user_recovery_codes_user_id_idx").on(table.userId)],
);

export const mfaChallenges = pgTable(
  "t_mfa_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("mfa_challenges_token_hash_unique").on(table.tokenHash),
    index("mfa_challenges_user_id_idx").on(table.userId),
  ],
);
