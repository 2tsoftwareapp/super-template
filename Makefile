SHELL := /bin/bash

# Active environment. Override per invocation, e.g. `make dev-api APP_ENV=staging`.
APP_ENV ?= development

.PHONY: help bootstrap dev dev-api dev-worker dev-web dev-admin dev-mobile dev-mobile-staging dev-mobile-prod infra-up infra-down db-generate db-migrate db-seed db-reset db-studio generate generate-check lint format test test-api test-web test-mobile build verify

help:
	@printf '%s\n' \
		'Available targets:' \
		'  bootstrap    Install deps, start infra, migrate, seed, generate contracts' \
		'  dev          Start API + Web + Admin (docker infra + pnpm dev)' \
		'  dev-api      Start API only' \
		'  dev-worker   Start the background worker only' \
		'  dev-web      Start Web only' \
		'  dev-admin    Start Admin only' \
		'  dev-mobile   Run Flutter app (env/dev.json)' \
		'  dev-mobile-staging Run Flutter app against env/staging.json' \
		'  dev-mobile-prod    Run Flutter app (release) against env/prod.json' \
		'  infra-up     Start Postgres + Mailpit' \
		'  infra-down   Stop docker infra' \
		'  db-generate  Drizzle generate migration' \
		'  db-migrate   Apply migrations' \
		'  db-seed      Seed database' \
		'  db-reset     Reset database' \
		'  db-studio    Open Drizzle Studio' \
		'  generate     Regenerate OpenAPI + Dart client' \
		'  generate-check Verify generated contracts are up to date (non-mutating)' \
		'  lint         Lint all packages' \
		'  format       Format all packages' \
		'  test         Run all tests' \
		'  test-api     Run API unit tests' \
		'  test-web     Run Web tests' \
		'  test-mobile  Run Flutter tests' \
		'  build        Build all packages' \
		'  verify       Full CI-style verify script'

bootstrap:
	./scripts/bootstrap.sh

dev:
	./scripts/dev.sh

dev-api:
	APP_ENV=$(APP_ENV) . ./scripts/load-env.sh && pnpm --filter api dev

dev-worker:
	APP_ENV=$(APP_ENV) . ./scripts/load-env.sh && pnpm --filter worker dev

dev-web:
	@printf '%s\n' 'Note: Web proxies to API at $${API_INTERNAL_URL:-http://localhost:3001}. Run `make dev-api` in another terminal if login fails.'
	APP_ENV=$(APP_ENV) . ./scripts/load-env.sh && pnpm --filter web dev

dev-admin:
	@printf '%s\n' 'Note: Admin proxies to API at $${API_INTERNAL_URL:-http://localhost:3001}. Run `make dev-api` in another terminal if login fails.'
	APP_ENV=$(APP_ENV) . ./scripts/load-env.sh && pnpm --filter admin dev

dev-mobile:
	sh scripts/mobile.sh dev

dev-mobile-staging:
	sh scripts/mobile.sh staging

dev-mobile-prod:
	sh scripts/mobile.sh prod

infra-up:
	docker compose -f infra/docker-compose.yml up -d

infra-down:
	docker compose -f infra/docker-compose.yml down

db-generate:
	node scripts/db-generate.mjs

db-migrate:
	pnpm --filter api db:migrate

db-seed:
	pnpm --filter api db:seed

db-reset:
	pnpm --filter api db:reset

db-studio:
	pnpm --filter @repo/database-runtime db:studio

generate:
	./scripts/generate-contracts.sh

generate-check:
	./scripts/generate-check.sh

lint:
	pnpm lint

format:
	pnpm format
	sh scripts/mobile.sh format

test:
	pnpm test

test-api:
	pnpm --filter api test

test-web:
	pnpm --filter web test

test-mobile:
	sh scripts/mobile.sh test

build:
	pnpm build

verify:
	./scripts/verify.sh
