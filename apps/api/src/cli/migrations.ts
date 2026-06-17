import type { Pool } from 'pg';

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

export const applySqlMigrations = async (pool: Pool): Promise<void> => {
  const migrationsFolder = resolveMigrationsFolder();
  const migrationFiles = readdirSync(migrationsFolder)
    .filter((file) => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  for (const migrationFile of migrationFiles) {
    const sql = readFileSync(resolve(migrationsFolder, migrationFile), 'utf8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await pool.query(statement);
    }
  }
};
