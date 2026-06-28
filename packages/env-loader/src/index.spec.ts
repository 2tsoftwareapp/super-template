import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadEnvFiles, resolveAppEnv } from './index';

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
  const keys = ['ENVLOADER_SPEC_FOO', 'ENVLOADER_SPEC_BAR', 'ENVLOADER_SPEC_BAZ'];
  let dir: string | undefined;

  afterEach(() => {
    for (const key of keys) delete process.env[key];
    delete process.env.APP_ENV;
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
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
});
