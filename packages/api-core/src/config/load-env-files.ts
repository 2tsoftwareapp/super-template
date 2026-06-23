import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// Candidate roots cover both ways this process gets started: cwd at the monorepo
// root, or cwd at apps/api (pnpm --filter api / Nest CLI / drizzle-kit / jest).
const candidateRoots = [
  process.cwd(),
  resolve(process.cwd(), '../..'),
  resolve(__dirname, '../../../..'),
  resolve(__dirname, '../../../../../..'),
];

/**
 * Single source of truth for loading repo env files into process.env. dotenv never
 * overrides a key that's already set, so .env always wins over .env.example, and
 * whichever candidate root resolves first wins over the rest.
 */
export const loadEnvFiles = (): void => {
  for (const filename of ['.env', '.env.example']) {
    for (const root of candidateRoots) {
      loadEnv({ path: resolve(root, filename), quiet: true });
    }
  }
};
