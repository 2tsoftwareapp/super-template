SHELL := /bin/bash

.PHONY: help bootstrap dev dev-api dev-web dev-mobile infra-up infra-down db-generate db-migrate db-seed db-reset db-studio generate generate-check lint format test test-api test-web test-mobile build verify extension-build extension-dev

help:
	@printf '%s\n' \
		'Available targets:' \
		'  bootstrap    Install deps, start infra, migrate, seed, generate contracts' \
		'  dev          Start API + Web + Admin (docker infra + pnpm dev)' \
		'  dev-api      Start API only' \
		'  dev-web      Start Web only' \
		'  dev-admin    Start Admin only' \
		'  dev-mobile   Run Flutter app' \
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
		'  verify       Full CI-style verify script' \
		'  extension-build  Build the browser-control extension (packages/extension)' \
		'  extension-dev    Start the shared Playwright MCP server in --extension mode'

bootstrap:
	./scripts/bootstrap.sh

dev:
	./scripts/dev.sh

dev-api:
	set -a; source .env; set +a; pnpm --filter api dev

dev-web:
	@printf '%s\n' 'Note: Web proxies to API at $${API_INTERNAL_URL:-http://localhost:3001}. Run `make dev-api` in another terminal if login fails.'
	set -a; source .env; set +a; pnpm --filter web dev

dev-admin:
	@printf '%s\n' 'Note: Admin proxies to API at $${API_INTERNAL_URL:-http://localhost:3001}. Run `make dev-api` in another terminal if login fails.'
	set -a; source .env; set +a; pnpm --filter admin dev

dev-mobile:
	sh scripts/mobile.sh dev

infra-up:
	docker compose -f infra/docker-compose.yml up -d

infra-down:
	docker compose -f infra/docker-compose.yml down

db-generate:
	pnpm --filter api db:generate

db-migrate:
	pnpm --filter api db:migrate

db-seed:
	pnpm --filter api db:seed

db-reset:
	pnpm --filter api db:reset

db-studio:
	pnpm --filter api db:studio

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

extension-build:
	pnpm --filter @repo/extension build

extension-dev:
	set -a; source .env; set +a; pnpm --filter @repo/extension dev
