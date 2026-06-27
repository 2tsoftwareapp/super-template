import { loadEnvFiles as loadLayeredEnvFiles } from '@repo/env-loader';

/**
 * Loads the repo's layered env files into process.env. Thin wrapper around the
 * shared {@link @repo/env-loader} so both the API and the Next apps resolve env
 * the exact same way. dotenv never overrides an already-set key, so real process
 * env always wins (see the shared loader for the full precedence order).
 */
export const loadEnvFiles = (): void => {
  loadLayeredEnvFiles();
};
