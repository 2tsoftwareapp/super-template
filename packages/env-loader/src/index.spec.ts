import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as cp from 'node:child_process';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadEnvFiles, resolveAppEnv } from './index';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof cp>();
  return {
    ...actual,
    execSync: vi.fn().mockImplementation((cmd, options) => {
      if ((globalThis as any).__mockExecSync) {
        return (globalThis as any).__mockExecSync(cmd, options);
      }
      return actual.execSync(cmd, options);
    }),
  };
});

describe('resolveAppEnv', () => {
  afterEach(() => {
    delete process.env.APP_ENV;
  });

  it('prefers the explicit argument', () => {
    process.env.APP_ENV = 'production';
    expect(resolveAppEnv('staging')).toBe('staging');
  });

  it('falls back to process.env.APP_ENV', () => {
    process.env.APP_ENV = 'staging';
    expect(resolveAppEnv()).toBe('staging');
  });

  it('defaults to development for empty or missing values', () => {
    delete process.env.APP_ENV;
    expect(resolveAppEnv()).toBe('development');
    expect(resolveAppEnv('')).toBe('development');
  });
});

describe('loadEnvFiles precedence', () => {
  const keys = ['ENVLOADER_SPEC_FOO', 'ENVLOADER_SPEC_BAR', 'ENVLOADER_SPEC_BAZ', 'REDIS_PORT', 'REDIS_URL', 'POSTGRES_EXPOSED_PORT', 'POSTGRES_PORT', 'DATABASE_URL', 'DATABASE_MIGRATE_URL', 'DATABASE_URL_TEST', 'DATABASE_URL_TEST_ADMIN', 'MAIL_PORT', 'MAILPIT_HTTP_PORT'];
  let dir: string | undefined;

  afterEach(() => {
    for (const key of keys) delete process.env[key];
    delete process.env.APP_ENV;
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it('skips .env.local when APP_ENV=test to keep tests hermetic', () => {
    dir = mkdtempSync(join(tmpdir(), 'envloader-'));
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), "packages: []\n");
    writeFileSync(join(dir, '.env.local'), 'ENVLOADER_SPEC_FOO=from_local\n');
    writeFileSync(join(dir, '.env.example'), 'ENVLOADER_SPEC_FOO=from_example\n');

    loadEnvFiles({ cwd: dir, appEnv: 'test' });

    expect(process.env.ENVLOADER_SPEC_FOO).toBe('from_example');
  });

  it('applies .env.local in development and lets it beat committed defaults', () => {
    dir = mkdtempSync(join(tmpdir(), 'envloader-'));
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), "packages: []\n");
    writeFileSync(join(dir, '.env.local'), 'ENVLOADER_SPEC_FOO=from_local\n');
    writeFileSync(join(dir, '.env.development'), 'ENVLOADER_SPEC_FOO=from_dev\n');

    loadEnvFiles({ cwd: dir, appEnv: 'development' });

    expect(process.env.ENVLOADER_SPEC_FOO).toBe('from_local');
  });

  it('skips .env.local in production to prevent accidental overrides', () => {
    dir = mkdtempSync(join(tmpdir(), 'envloader-'));
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), "packages: []\n");
    writeFileSync(join(dir, '.env.local'), 'ENVLOADER_SPEC_FOO=from_local\n');
    writeFileSync(join(dir, '.env.production'), 'ENVLOADER_SPEC_FOO=from_prod\n');

    loadEnvFiles({ cwd: dir, appEnv: 'production' });

    expect(process.env.ENVLOADER_SPEC_FOO).toBe('from_prod');
  });

  it('never overrides values already present in process.env', () => {
    dir = mkdtempSync(join(tmpdir(), 'envloader-'));
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), "packages: []\n");
    writeFileSync(join(dir, '.env.development'), 'ENVLOADER_SPEC_FOO=from_file\n');
    process.env.ENVLOADER_SPEC_FOO = 'from_real_env';

    loadEnvFiles({ cwd: dir, appEnv: 'development' });

    expect(process.env.ENVLOADER_SPEC_FOO).toBe('from_real_env');
  });

  it('prefers per-env personal overrides (.env.<env>.local) over everything on disk', () => {
    dir = mkdtempSync(join(tmpdir(), 'envloader-'));
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), "packages: []\n");
    writeFileSync(join(dir, '.env.development.local'), 'ENVLOADER_SPEC_FOO=from_env_local\n');
    writeFileSync(join(dir, '.env.local'), 'ENVLOADER_SPEC_FOO=from_local\n');
    writeFileSync(join(dir, '.env.development'), 'ENVLOADER_SPEC_FOO=from_dev\n');

    loadEnvFiles({ cwd: dir, appEnv: 'development' });

    expect(process.env.ENVLOADER_SPEC_FOO).toBe('from_env_local');
  });

  it('applies files highest-to-lowest, first definition wins', () => {
    dir = mkdtempSync(join(tmpdir(), 'envloader-'));
    // Marks the dir as the repo root so the loader does not walk upward.
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), "packages: []\n");
    writeFileSync(join(dir, '.env.development'), 'ENVLOADER_SPEC_FOO=from_dev\n');
    writeFileSync(
      join(dir, '.env'),
      'ENVLOADER_SPEC_FOO=from_env\nENVLOADER_SPEC_BAR=from_env\n',
    );
    writeFileSync(
      join(dir, '.env.example'),
      'ENVLOADER_SPEC_BAR=from_example\nENVLOADER_SPEC_BAZ=from_example\n',
    );

    const resolved = loadEnvFiles({ cwd: dir, appEnv: 'development' });

    expect(resolved).toBe('development');
    expect(process.env.APP_ENV).toBe('development');
    // .env.development beats .env
    expect(process.env.ENVLOADER_SPEC_FOO).toBe('from_dev');
    // .env beats .env.example
    expect(process.env.ENVLOADER_SPEC_BAR).toBe('from_env');
    // only defined in .env.example
    expect(process.env.ENVLOADER_SPEC_BAZ).toBe('from_example');
  });

  it('dynamically increments REDIS_PORT when the port is in use', () => {
    dir = mkdtempSync(join(tmpdir(), 'envloader-redis-'));
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), "packages: []\n");
    writeFileSync(join(dir, '.env'), 'REDIS_PORT=6379\nREDIS_URL=redis://127.0.0.1:6379\n');

    (globalThis as any).__mockExecSync = (cmd: any) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes('ps --services')) {
        return ''; // docker compose redis not running
      }
      if (cmdStr.includes('listen(6379')) {
        throw new Error('Port 6379 in use');
      }
      if (cmdStr.includes('listen(6380')) {
        return Buffer.from(''); // Port 6380 free
      }
      return Buffer.from('');
    };

    try {
      loadEnvFiles({ cwd: dir, appEnv: 'development' });
      expect(process.env.REDIS_PORT).toBe('6380');
      expect(process.env.REDIS_URL).toBe('redis://127.0.0.1:6380');
    } finally {
      delete (globalThis as any).__mockExecSync;
    }
  });

  it('dynamically increments POSTGRES_EXPOSED_PORT and updates DATABASE_URL variants', () => {
    dir = mkdtempSync(join(tmpdir(), 'envloader-postgres-'));
    writeFileSync(join(dir, 'pnpm-workspace.yaml'), "packages: []\n");
    writeFileSync(
      join(dir, '.env'),
      'POSTGRES_EXPOSED_PORT=5432\n' +
      'DATABASE_URL=postgresql://user:pass@localhost:5432/db\n' +
      'DATABASE_MIGRATE_URL=postgresql://user:pass@localhost:5432/db_migrate\n'
    );

    (globalThis as any).__mockExecSync = (cmd: any) => {
      const cmdStr = String(cmd);
      if (cmdStr.includes('ps --services')) {
        return ''; // docker compose postgres not running
      }
      if (cmdStr.includes('listen(5432')) {
        throw new Error('Port 5432 in use');
      }
      if (cmdStr.includes('listen(5433')) {
        return Buffer.from(''); // Port 5433 free
      }
      return Buffer.from('');
    };

    try {
      loadEnvFiles({ cwd: dir, appEnv: 'development' });
      expect(process.env.POSTGRES_EXPOSED_PORT).toBe('5433');
      expect(process.env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5433/db');
      expect(process.env.DATABASE_MIGRATE_URL).toBe('postgresql://user:pass@localhost:5433/db_migrate');
    } finally {
      delete (globalThis as any).__mockExecSync;
    }
  });
});
