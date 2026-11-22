# Getting started

## Requirements

- Node.js 24 and pnpm 11.9 (`corepack enable` picks the version from `package.json`)
- Docker, for Postgres 18 and Mailpit (or any Postgres reachable through `DATABASE_URL`)
- Flutter stable, only for `apps/mobile`

## Run everything

```bash
pnpm install
docker compose up -d          # Postgres on :5434, Mailpit on :1025 (SMTP) / :8025 (UI)
cp .env.example .env          # read by db scripts, api and worker; exported vars win
pnpm db:migrate && pnpm db:seed

pnpm dev                      # api    -> http://localhost:3001/api/v1
pnpm dev:admin                # admin  -> http://localhost:3002
pnpm dev:web                  # web    -> http://localhost:3000
pnpm dev:worker               # worker (claims jobs)
```

`pnpm db:seed` creates the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The
values in `.env.example` are local placeholders; change them anywhere else.

## Mobile

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001   # Android emulator
flutter run --dart-define=API_BASE_URL=http://localhost:3001  # iOS simulator
```

Debug builds allow plain HTTP to the local API; release builds expect HTTPS.

## Definition of done

```bash
pnpm run check         # typecheck + unit and e2e tests (e2e needs Postgres)
pnpm run format:check
```

CI runs the same commands, then builds admin, web and these docs, and runs
`flutter analyze` and `flutter test`.

## These docs

```bash
pnpm docs:dev     # http://localhost:5173/super-template/
pnpm docs:build
```

Every push to `main` that touches `docs/` redeploys the site to GitHub Pages.
