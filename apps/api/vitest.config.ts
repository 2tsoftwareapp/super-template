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

const intraPackageAlias = (alias: string, packageName: string) => ({
  find: new RegExp(`^${alias}/(.+)$`),
  replacement: path.join(packagesDir, packageName, 'src/$1'),
});

export default defineConfig({
  test: {
    maxWorkers: 1,
    include: [
      'test/**/*.{test,spec}.ts',
      '../../packages/api-contract/src/**/*.{test,spec}.ts',
      '../../packages/api-bootstrap/src/**/*.{test,spec}.ts',
      '../../packages/api-core/src/**/*.{test,spec}.ts',
      '../../packages/api-sort/src/**/*.{test,spec}.ts',
      '../../packages/api-database/src/**/*.{test,spec}.ts',
      '../../packages/api-identity/src/**/*.{test,spec}.ts',
      '../../packages/api-health/src/**/*.{test,spec}.ts',
      '../../packages/api-workspace/src/**/*.{test,spec}.ts',
      '../../packages/api-platform/src/**/*.{test,spec}.ts',
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
      packageAlias('api-sort'),
      packageSubpathAlias('api-sort'),
      packageAlias('api-identity'),
      packageSubpathAlias('api-identity'),
      packageAlias('api-platform'),
      packageSubpathAlias('api-platform'),
      packageAlias('api-workspace'),
      packageSubpathAlias('api-workspace'),
      intraPackageAlias('@identity', 'api-identity'),
      intraPackageAlias('@platform', 'api-platform'),
      intraPackageAlias('@workspace', 'api-workspace'),
    ],
  },
});
