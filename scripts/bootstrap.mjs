#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  process.exit(result.status ?? 1);
};

if (platform() === 'win32') {
  run('powershell', [
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    resolve(root, 'scripts/bootstrap.ps1'),
  ]);
} else {
  run('bash', [resolve(root, 'scripts/bootstrap.sh')]);
}
