import { defineConfig, globalIgnores } from 'eslint/config';

import { baseConfig } from './packages/eslint-config/base.mjs';

export default defineConfig([
  ...baseConfig,
  globalIgnores([
    '**/dist/**',
    '**/coverage/**',
    '**/node_modules/**',
    'packages/api-contract/src/generated/**',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    'apps/api/vitest.config.ts',
    'apps/api/webpack.config.js',
    'packages/web-ui/vitest.config.ts',
    'packages/web-hooks/vitest.config.ts',
    'packages/api-core/vitest.config.ts',
    'eslint.config.mjs',
  ]),
]);
