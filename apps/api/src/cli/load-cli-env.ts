import { loadEnvFiles } from "@repo/env-loader";

/**
 * Loads layered env files for CLI scripts. When POSTGRES_EXPOSED_PORT was set
 * in the real environment BEFORE loading (CI with a live service), pin it so
 * the free-port scan does not rewrite DATABASE_* URLs past the live instance.
 */
export const loadCliEnv = (): string => {
  const pinned = process.env.POSTGRES_EXPOSED_PORT
    ? Number(process.env.POSTGRES_EXPOSED_PORT)
    : undefined;
  if (Number.isFinite(pinned)) {
    return loadEnvFiles({ pinnedPostgresPort: pinned! });
  }
  return loadEnvFiles();
};
