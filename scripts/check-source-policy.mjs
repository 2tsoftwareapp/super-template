#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import process from 'node:process';

const roots = [
  'apps/api/src',
  'apps/api/test',
  'packages/api-core/src',
  'packages/api-database/src',
  'packages/api-identity/src',
  'packages/api-platform/src',
  'packages/api-workspace/src',
];

const patterns = [
  {
    name: '@boundaries-ignore',
    regex: '@boundaries-ignore',
    message: 'Remove boundary-ignore comments and fix the underlying import surface.',
  },
  {
    name: 'explicit any',
    regex: ':\\s*any\\b|<\\s*any\\s*>|\\bas\\s+any\\b',
    message: 'Use concrete types instead of explicit any.',
  },
];

let failed = false;

for (const { name, regex, message } of patterns) {
  try {
    const output = execFileSync(
      'rg',
      [
        '-n',
        regex,
        ...roots,
        '--glob',
        '!**/*.tsbuildinfo',
        '--glob',
        '!**/generated/**',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );

    if (output.trim().length > 0) {
      failed = true;
      process.stderr.write(`Policy violation: ${name}\n`);
      process.stderr.write(`${output}\n`);
      process.stderr.write(`${message}\n`);
    }
  } catch (error) {
    if (typeof error?.status === 'number' && error.status === 1) {
      continue;
    }

    throw error;
  }
}

if (failed) {
  process.exit(1);
}
