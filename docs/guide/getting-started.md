# Getting started

This page takes a fresh clone to a running stack: API, worker, web, admin and
the mobile app, with a database, a seeded admin and a local mail inbox.

## 1. Install the tools

| Tool    | Version    | Why                                                                     |
| ------- | ---------- | ----------------------------------------------------------------------- |
| Bun     | 1.3+       | package manager and script runner (`curl -fsSL bun.sh/install \| bash`) |
| Node.js | 24         | runtime for the API, worker, Next.js and Vitest                         |
| Docker  | any recent | Postgres 18 and Mailpit for local development                           |
| Flutter | stable     | only for `apps/mobile`                                                  |

Any Postgres reachable through `DATABASE_URL` works instead of Docker.

## 2. Install and configure

```bash
git clone https://github.com/2tsoftwareapp/super-template.git my-app
cd my-app
bun install
cp .env.example .env
```

`.env` is read by the API, the worker and the database scripts. Variables
exported in your shell win over the file. Every value in `.env.example` is a
local placeholder; see [Configuration](./configuration) for the full list.

## 3. Start the database and seed it

```bash
bun run bootstrap
```

`bootstrap` runs three steps you can also run alone:

```bash
docker compose up -d --wait   # Postgres on :5434, Mailpit SMTP :1025, UI :8025
bun run db:migrate               # apply packages/db/migrations
bun run db:seed                  # create the admin from ADMIN_EMAIL / ADMIN_PASSWORD
```

The seed is idempotent: it prints `admin already exists` on later runs.

## 4. Run the apps

```bash
bun run dev:all
```

| Surface | URL                                 | Sign in with                                 |
| ------- | ----------------------------------- | -------------------------------------------- |
| API     | http://localhost:3001/api/v1/health | —                                            |
| Web     | http://localhost:3000               | create an account at `/register`             |
| Admin   | http://localhost:3002               | `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` |
| Mailpit | http://localhost:8025               | — (every mail the worker sends lands here)   |

`dev:all` starts the API, worker, web and admin in one terminal with prefixed
logs. To run them separately: `bun run dev`, `bun run dev:worker`, `bun run dev:web`,
`bun run dev:admin`.

![Web home](/screenshots/web-home.png)

## 5. Try the main flows

1. Open http://localhost:3000/register and create an account. You land on `/account`.
2. Sign out, click **Forgot password?** on `/login`, and enter the same email.
3. Open Mailpit at http://localhost:8025 and follow the reset link. The worker
   must be running for the mail to leave the queue.
4. Sign in to the admin at http://localhost:3002. The new user is under
   **Users**; block them and their web session stops working on the next request.
5. On **Jobs**, enqueue `demo.fail` and watch it retry with backoff, then fail.

## 6. Run the mobile app

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001   # Android emulator
flutter run --dart-define=API_BASE_URL=http://localhost:3001  # iOS simulator
```

A physical device needs your computer's LAN address, for example
`--dart-define=API_BASE_URL=http://192.168.1.20:3001`. Details and release
builds: [Mobile](./mobile).

## 7. Check your work

```bash
bun run check          # ESLint + typecheck + unit and e2e tests
bun run format:check   # Prettier
```

Both must pass before a change is done. The full list, including builds and
Flutter, is in [Testing](./testing).

## These docs

```bash
bun run docs:dev     # http://localhost:5173/super-template/
bun run docs:build
```

A push to `main` that touches `docs/` redeploys the site to GitHub Pages.
