import type { Pool, PoolClient } from 'pg';

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIGRATIONS_TABLE = 'public.__app_migrations';

export const resolveMigrationsFolder = (): string => {
  const candidates = [
    resolve(process.cwd(), 'drizzle'),
    resolve(process.cwd(), 'apps/api/drizzle'),
  ];

  const folder = candidates.find((candidate) => {
    if (!existsSync(candidate)) {
      return false;
    }

    return readdirSync(candidate).some((file) => file.endsWith('.sql'));
  });

  if (!folder) {
    throw new Error('Could not resolve the Drizzle migrations folder');
  }

  return folder;
};

const listMigrationFiles = (migrationsFolder: string): string[] =>
  readdirSync(migrationsFolder)
    .filter((file) => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

const splitSqlStatements = (sql: string): string[] =>
  sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

const ensureMigrationsTable = async (pool: Pool): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id serial PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
};

const getAppliedMigrations = async (pool: Pool): Promise<Set<string>> => {
  const result = await pool.query<{ filename: string }>(
    `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY id`,
  );

  return new Set(result.rows.map((row) => row.filename));
};

const schemaAlreadyInitialized = async (pool: Pool): Promise<boolean> => {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT to_regclass('public.users') IS NOT NULL AS exists`,
  );

  return result.rows[0]?.exists ?? false;
};

/** Backfill ledger for DBs migrated before tracking existed. */
const backfillMigrationsLedger = async (
  pool: Pool,
  migrationFiles: string[],
): Promise<void> => {
  const applied = await getAppliedMigrations(pool);
  if (applied.size > 0) {
    return;
  }

  if (!(await schemaAlreadyInitialized(pool))) {
    return;
  }

  for (const migrationFile of migrationFiles) {
    await pool.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING`,
      [migrationFile],
    );
  }
};

const applyMigrationFile = async (
  client: PoolClient,
  migrationsFolder: string,
  migrationFile: string,
): Promise<void> => {
  const sql = readFileSync(resolve(migrationsFolder, migrationFile), 'utf8');
  const statements = splitSqlStatements(sql);

  await client.query('BEGIN');

  try {
    for (const statement of statements) {
      await client.query(statement);
    }

    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
      [migrationFile],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

export const applySqlMigrations = async (pool: Pool): Promise<void> => {
  const migrationsFolder = resolveMigrationsFolder();
  const migrationFiles = listMigrationFiles(migrationsFolder);

  await ensureMigrationsTable(pool);
  await backfillMigrationsLedger(pool, migrationFiles);

  const applied = await getAppliedMigrations(pool);

  for (const migrationFile of migrationFiles) {
    if (applied.has(migrationFile)) {
      continue;
    }

    const client = await pool.connect();

    try {
      await applyMigrationFile(client, migrationsFolder, migrationFile);
      console.log(`Applied migration ${migrationFile}`);
    } finally {
      client.release();
    }
  }
};
