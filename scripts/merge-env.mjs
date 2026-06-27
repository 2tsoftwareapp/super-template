import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const repoRoot = resolve(import.meta.dirname, '..');

export const parseEnvFile = (filePath) => {
  if (!existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
};

/**
 * Merges layered env files using the same effective precedence as load-env.sh
 * (last file wins). Matches what Node apps resolve after @repo/env-loader runs.
 */
export const mergeEnvFiles = (
  root = repoRoot,
  appEnv = process.env.APP_ENV?.trim() || 'development',
) => {
  const layers = [
    '.env.example',
    '.env',
    `.env.${appEnv}`,
    appEnv === 'test' ? null : '.env.local',
    `.env.${appEnv}.local`,
  ].filter(Boolean);

  const merged = {};
  const loadedFiles = [];

  for (const file of layers) {
    const filePath = resolve(root, file);
    if (!existsSync(filePath)) {
      continue;
    }
    loadedFiles.push(file);
    Object.assign(merged, parseEnvFile(filePath));
  }

  return { merged, loadedFiles, appEnv };
};
