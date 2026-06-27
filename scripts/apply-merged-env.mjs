#!/usr/bin/env node
/**
 * Prints KEY=VALUE lines from merged env files for shell bootstraps (PowerShell).
 * Usage: node scripts/apply-merged-env.mjs | while IFS='=' read -r k v; do export "$k=$v"; done
 */
import { mergeEnvFiles } from './merge-env.mjs';

const { merged } = mergeEnvFiles();

for (const [key, value] of Object.entries(merged)) {
  process.stdout.write(`${key}=${value}\n`);
}
