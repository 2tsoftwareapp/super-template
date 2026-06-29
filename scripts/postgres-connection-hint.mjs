#!/usr/bin/env node
/**
 * Prints Postgres connection hints after a failed migrate/connect (P0 preflight).
 */
import { mergeEnvFiles } from './merge-env.mjs';
import { printPostgresConnectionHint } from './port-preflight.mjs';

const databaseUrl =
  process.argv[2]?.trim() ||
  process.env.DATABASE_MIGRATE_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error('postgres-connection-hint: no database URL provided');
  process.exit(1);
}

const { merged } = mergeEnvFiles();
await printPostgresConnectionHint(databaseUrl, { ...merged, ...process.env });
