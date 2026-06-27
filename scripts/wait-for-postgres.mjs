#!/usr/bin/env node
/**
 * Cross-platform PostgreSQL readiness check (used by bootstrap on all OSes).
 */
import { connect } from 'node:net';
import { mergeEnvFiles } from './merge-env.mjs';

const { merged } = mergeEnvFiles();

const host = merged.POSTGRES_HOST ?? process.env.POSTGRES_HOST ?? 'localhost';
const port = Number(
  merged.POSTGRES_EXPOSED_PORT ??
    merged.POSTGRES_PORT ??
    process.env.POSTGRES_EXPOSED_PORT ??
    process.env.POSTGRES_PORT ??
    5432,
);

const canConnect = () =>
  new Promise((resolveReady) => {
    const socket = connect({ host, port });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.end();
      resolveReady(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolveReady(false);
    });
    socket.once('error', () => resolveReady(false));
  });

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

for (let attempt = 1; attempt <= 60; attempt += 1) {
  if (await canConnect()) {
    process.exit(0);
  }
  await sleep(1000);
}

console.error(`PostgreSQL did not become ready at ${host}:${port} in time.`);
process.exit(1);
