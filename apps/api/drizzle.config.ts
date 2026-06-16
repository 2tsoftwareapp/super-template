import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

loadEnv({
  path: resolve(__dirname, '../../.env'),
});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for Drizzle commands.');
}

export default defineConfig({
  schema: '../../packages/api-database/src/schema/**/*.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
