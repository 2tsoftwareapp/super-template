import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const WORKSPACE_MARKER = 'pnpm-workspace.yaml';

/** Walks up from [start] to find the monorepo root (folder with pnpm-workspace.yaml). */
const findRepoRoot = (start: string): string => {
  let current = start;
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(resolve(current, WORKSPACE_MARKER))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return start;
};

export type AppEnvName = 'development' | 'test' | 'staging' | 'production';

export interface LoadEnvOptions {
  /** Override APP_ENV detection (defaults to process.env.APP_ENV or 'development'). */
  appEnv?: string;
  /** Directory to resolve env files from (defaults to process.cwd()). */
  cwd?: string;
}

/**
 * Resolves the active APP_ENV from the real process env (or an explicit override),
 * defaulting to 'development'. APP_ENV is intentionally never read from the env-file
 * cascade to avoid a chicken-and-egg problem.
 */
export const resolveAppEnv = (explicit?: string): string => {
  const value = explicit ?? process.env.APP_ENV;
  return value && value.length > 0 ? value : 'development';
};

/**
 * Loads layered env files into process.env. dotenv never overrides a key that is
 * already set, so the first file to define a key wins. Files are applied from
 * highest to lowest precedence:
 *
 *   1. real process env (already set — always wins)
 *   2. .env.<APP_ENV>.local   personal per-env overrides       [gitignored]
 *   3. .env.local             personal overrides (all envs)    [gitignored, skipped when APP_ENV=test]
 *   4. .env.<APP_ENV>         committed non-secret defaults
 *   5. .env                   legacy local catch-all           [gitignored]
 *   6. .env.example           documented fallback
 *
 * Both the current working directory and the repo root are searched for each file
 * so the loader works whether the process starts at the monorepo root or inside an app.
 *
 * @returns the resolved APP_ENV.
 */
export const loadEnvFiles = (options: LoadEnvOptions = {}): string => {
  const cwd = options.cwd ?? process.cwd();
  const appEnv = resolveAppEnv(options.appEnv);
  const root = findRepoRoot(cwd);

  const files = [
    `.env.${appEnv}.local`,
    appEnv === 'test' ? null : '.env.local',
    `.env.${appEnv}`,
    '.env',
    '.env.example',
  ].filter((name): name is string => name !== null);

  const roots = cwd === root ? [cwd] : [cwd, root];

  for (const file of files) {
    for (const dir of roots) {
      loadEnv({ path: resolve(dir, file), quiet: true });
    }
  }

  process.env.APP_ENV ??= appEnv;

  return appEnv;
};
