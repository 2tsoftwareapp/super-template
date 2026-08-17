import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const outboxMessages = pgTable("outbox_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  topic: text("topic").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("PENDING"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
