import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

/** Load env from apps/api and monorepo root (pnpm --filter api runs with cwd apps/api). */
export const loadCliEnv = (): void => {
  loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
  loadEnv({ path: resolve(process.cwd(), '../../.env'), quiet: true });
};
