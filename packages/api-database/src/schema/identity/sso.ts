import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../shared/timestamps";
import { authSessions } from "./auth";
import { users } from "./users";

export const externalIdentities = pgTable(
  "r_external_identities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerSubject: text("provider_subject").notNull(),
    email: text("email").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("external_identities_provider_subject_unique").on(
      table.provider,
      table.providerSubject,
    ),
    index("external_identities_user_id_idx").on(table.userId),
  ],
);

// Short-lived server-side record for one Authorization Code + PKCE round trip.
// stateHash lets the callback look this up without trusting the raw state value
// from the query string as anything more than an opaque lookup key.
// SECURITY: code_verifier is AES-GCM encrypted at rest (never plaintext).
export const ssoLoginStates = pgTable(
  "t_sso_login_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    stateHash: text("state_hash").notNull(),
    nonce: text("nonce").notNull(),
    codeVerifierCiphertext: text("code_verifier_ciphertext").notNull(),
    codeVerifierIv: text("code_verifier_iv").notNull(),
    codeVerifierAuthTag: text("code_verifier_auth_tag").notNull(),
    redirectUri: text("redirect_uri").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sso_login_states_state_hash_unique").on(table.stateHash)],
);

// One-time, short-lived code handed to the client after SSO callback so tokens
// never travel in URL fragments. Consumed by POST /auth/sso/exchange.
// SECURITY: stores session_id only — tokens are re-issued on exchange.
export const ssoSessionExchanges = pgTable(
  "t_sso_session_exchanges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    codeHash: text("code_hash").notNull(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => authSessions.id, { onDelete: "cascade" }),
    organizationId: text("organization_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sso_session_exchanges_code_hash_unique").on(table.codeHash),
    index("sso_session_exchanges_session_id_idx").on(table.sessionId),
  ],
);
