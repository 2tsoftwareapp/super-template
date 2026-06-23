import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { timestamps } from '../shared/timestamps';
import { users } from './users';

export const externalIdentities = pgTable(
  'external_identities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerSubject: text('provider_subject').notNull(),
    email: text('email').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('external_identities_provider_subject_unique').on(
      table.provider,
      table.providerSubject,
    ),
    index('external_identities_user_id_idx').on(table.userId),
  ],
);

// Short-lived server-side record for one Authorization Code + PKCE round trip.
// stateHash lets the callback look this up without trusting the raw state value
// from the query string as anything more than an opaque lookup key.
export const ssoLoginStates = pgTable(
  'sso_login_states',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: text('provider').notNull(),
    stateHash: text('state_hash').notNull(),
    nonce: text('nonce').notNull(),
    codeVerifier: text('code_verifier').notNull(),
    redirectUri: text('redirect_uri').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('sso_login_states_state_hash_unique').on(table.stateHash),
  ],
);
