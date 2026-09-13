#!/usr/bin/env node
// Installs git hooks from scripts/hooks by pointing core.hooksPath at that
// directory. Runs automatically during `pnpm bootstrap` and can be re-run
// manually at any time: `pnpm hooks:install` (idempotent).
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const hooksSrc = join(root, 'scripts', 'hooks');

if (!existsSync(hooksSrc)) {
  console.error(`hooks:install: hooks directory not found at ${hooksSrc}`);
  process.exit(1);
}

// Mirror scripts/hooks/* into .githooks so every hook file is executable and
// plain files (no extension juggling) work on all platforms. Hook names have
// no extension (pre-push, pre-commit, …), so installer scripts are skipped.
const hooksDir = join(root, '.githooks');
mkdirSync(hooksDir, { recursive: true });
for (const entry of readdirSync(hooksSrc)) {
  if (entry.includes('.')) continue;
  const source = join(hooksSrc, entry);
  const target = join(hooksDir, entry);
  const body = readFileSync(source);
  writeFileSync(target, body);
  chmodSync(target, 0o755);
}

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
});
process.exit(result.status ?? 1);
