#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

has_postgres_e2e_prereqs() {
  node -e "const fs=require('node:fs');const path=require('node:path');const {Pool}=require(path.resolve(process.cwd(),'apps/api/node_modules/pg'));const parseEnvFile=(filePath)=>{if(!fs.existsSync(filePath)){return {}};return Object.fromEntries(fs.readFileSync(filePath,'utf8').split(/\r?\n/).map((line)=>line.trim()).filter((line)=>line&&!line.startsWith('#')&&line.includes('=')).map((line)=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1)];}));};const env={...parseEnvFile(path.resolve(process.cwd(),'.env.example')),...parseEnvFile(path.resolve(process.cwd(),'.env')),...process.env};const adminUrl=env.DATABASE_URL_TEST_ADMIN??env.DATABASE_MIGRATE_URL;if(!adminUrl){process.exit(1)};const pool=new Pool({connectionString:adminUrl,connectionTimeoutMillis:1500});pool.query('select 1').then(()=>pool.end().then(()=>process.exit(0))).catch(()=>pool.end().finally(()=>process.exit(1)));"
}

./scripts/generate-check.sh
pnpm lint
pnpm typecheck
pnpm test
if has_postgres_e2e_prereqs; then
  pnpm --filter api test:e2e
else
  printf '%s\n' '[verify] Postgres unavailable or credentials rejected; skipping API e2e verification on this machine.'
fi
pnpm build
if sh scripts/mobile.sh doctor >/dev/null 2>&1; then
  sh scripts/mobile.sh format-check
  sh scripts/mobile.sh analyze
  sh scripts/mobile.sh test
else
  printf '%s\n' '[verify] Dart/Flutter unavailable; skipping mobile verification on this machine.'
fi
