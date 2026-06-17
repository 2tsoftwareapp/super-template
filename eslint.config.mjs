import { defineConfig, globalIgnores } from 'eslint/config';

import { baseConfig } from './packages/eslint-config/base.mjs';

export default defineConfig([
  ...baseConfig,
  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    'apps/api/vitest.config.ts',
    'apps/api/webpack.config.js',
    'eslint.config.mjs',
  ]),
]);
