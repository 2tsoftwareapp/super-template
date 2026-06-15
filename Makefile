SHELL := /bin/bash

.PHONY: bootstrap dev dev-api dev-web dev-mobile infra-up infra-down db-generate db-migrate db-seed db-reset db-studio generate lint format test test-api test-web test-mobile build verify

bootstrap:
	./scripts/bootstrap.sh

dev:
	./scripts/dev.sh

dev-api:
	set -a; source .env; set +a; pnpm --filter api dev

dev-web:
	set -a; source .env; set +a; pnpm --filter web dev

dev-mobile:
	cd apps/mobile && flutter run --dart-define-from-file=env/dev.json

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

lint:
	pnpm lint

format:
	pnpm format
	cd apps/mobile && dart format --set-exit-if-changed .

test:
	pnpm test

test-api:
	pnpm --filter api test

test-web:
	pnpm --filter web test

test-mobile:
	cd apps/mobile && flutter test

build:
	pnpm build

verify:
	./scripts/verify.sh
