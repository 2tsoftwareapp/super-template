import { loadEnvFiles } from '@repo/api-core/config/load-env-files';
import { defineConfig } from 'drizzle-kit';

loadEnvFiles();

if (!process.env.DATABASE_MIGRATE_URL && !process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_MIGRATE_URL or DATABASE_URL is required for Drizzle commands.',
  );
}

export default defineConfig({
  schema: '../../packages/api-database/src/schema/**/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_MIGRATE_URL ??
      process.env.DATABASE_URL ??
      'postgresql://localhost:5432/postgres',
  },
  strict: true,
  verbose: true,
});
