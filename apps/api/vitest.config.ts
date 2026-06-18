import path from 'node:path';
import { defineConfig } from 'vitest/config';

const packagesDir = path.resolve(__dirname, '../../packages');

const packageAlias = (name: string) => ({
  find: new RegExp(`^@repo/${name}$`),
  replacement: path.join(packagesDir, name, 'src/index.ts'),
});

const packageSubpathAlias = (name: string) => ({
  find: new RegExp(`^@repo/${name}/(.+)$`),
  replacement: path.join(packagesDir, name, 'src/$1'),
});

export default defineConfig({
  test: {
    maxWorkers: 1,
    include: [
      'test/**/*.{test,spec}.ts',
      '../../packages/api-contract/src/**/*.{test,spec}.ts',
      '../../packages/api-core/src/**/*.{test,spec}.ts',
      '../../packages/api-identity/src/**/*.{test,spec}.ts',
      '../../packages/api-workspace/src/**/*.{test,spec}.ts',
    ],
  },
  resolve: {
    alias: [
      packageAlias('api-contract'),
      packageSubpathAlias('api-contract'),
      packageAlias('api-core'),
      packageSubpathAlias('api-core'),
      packageAlias('api-database'),
      packageSubpathAlias('api-database'),
      packageAlias('api-identity'),
      packageSubpathAlias('api-identity'),
      packageAlias('api-platform'),
      packageSubpathAlias('api-platform'),
      packageAlias('api-workspace'),
      packageSubpathAlias('api-workspace'),
    ],
  },
});
