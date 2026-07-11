#!/usr/bin/env node
import { mergeEnvFiles } from './merge-env.mjs';

const { merged } = mergeEnvFiles();

const keys = [
  'POSTGRES_EXPOSED_PORT',
  'POSTGRES_PORT',
  'DATABASE_URL',
  'DATABASE_MIGRATE_URL',
  'DATABASE_URL_TEST',
  'DATABASE_URL_TEST_ADMIN',
  'REDIS_PORT',
  'REDIS_URL',
  'MAIL_PORT',
  'MAILPIT_HTTP_PORT',
];

for (const key of keys) {
  if (merged[key] !== undefined) {
    console.log(`export ${key}="${merged[key]}"`);
  }
}
