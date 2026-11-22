# Troubleshooting

## Setup

**`bun: command not found`**
Install it with `curl -fsSL https://bun.sh/install | bash`, then open a new
shell (the installer adds `~/.bun/bin` to your `PATH`).

**`node: command not found` or `Unsupported engine` during a script**
Bun runs the scripts, but the API, worker, Next.js and Vitest still run on
Node 24. With nvm: `source ~/.nvm/nvm.sh && nvm use 24`.

**`docker compose up` fails: port 5434, 1025 or 8025 is already allocated**
Another Postgres or Mailpit is running. Stop it, or change the left side of the
port mapping in `docker-compose.yml` and the matching `DATABASE_URL` / `SMTP_URL` in `.env`.

**`bun run db:migrate` fails with `ECONNREFUSED 127.0.0.1:5434`**
Postgres is not up yet. `bun run bootstrap` waits for it; otherwise run
`docker compose up -d --wait` first.

**`DATABASE_URL` is empty / `Invalid environment` on start**
`.env` is missing. `cp .env.example .env`. Every API variable is validated at
start; the message names the bad key.

**`JWT_ACCESS_SECRET` too short**
It needs at least 32 characters. Generate one with `openssl rand -base64 48`.

## Signing in

**Admin login says "Invalid email or password" with the right password**
The seed only creates the admin when the email does not exist; changing
`ADMIN_PASSWORD` later does not update it. Change it from the admin **Account**
page, or delete the user row and run `bun run db:seed` again.

**"Too many attempts"**
The login limit is 10 per minute per IP and email, and 50 per 15 minutes per
email. Wait, or restart the API (the counters live in API memory).

**Web or admin keeps sending me back to `/login`, only in production**
Session cookies are `Secure` when `NODE_ENV=production`; browsers drop them over
plain HTTP. Serve the apps over HTTPS (see [Deployment](./deployment)).

**Every form submit answers 403 `AUTH_FORBIDDEN`**
The BFF compares the request `Origin` with `WEB_ORIGIN` / `ADMIN_ORIGIN`. Set
them to the exact public origin: scheme, host and port, no trailing slash.

**Signed out right after changing a password on another device**
Expected: a password change, reset or block revokes every session and access token.

## Mail

**No reset mail**

1. Open Mailpit at http://localhost:8025.
2. Is the worker running? `bun run dev:all` starts it; alone: `bun run dev:worker`.
3. Look at the admin **Jobs** page: a failed `mail.send` shows its error.
4. Forgot-password answers 202 for unknown or blocked accounts too, and sends nothing.

**The link in the mail points to the wrong host**
It is built from `WEB_URL`.

## Uploads

**413 `FILE_TOO_LARGE`** — raise `MAX_UPLOAD_BYTES` (and your reverse proxy's body limit).
**415 `FILE_TYPE_NOT_ALLOWED`** — only PNG, JPEG, WebP, PDF, plain text and CSV are
accepted; edit the allow-list in `apps/api/src/modules/files/files.service.ts`.
**Files gone after a container rebuild** — `STORAGE_DIR` must be on a volume
(`api-storage` in `compose.prod.yaml`).

## Jobs

**A job stays `PROCESSING`**
Its worker died. It returns to `PENDING` 10 minutes after it was claimed.

**Jobs fail with `No handler for <type>`**
The type is not in `apps/worker/src/handlers.ts`. It fails at once, without retries.

See [Jobs and worker](./jobs#operations) for retrying failed jobs.

## Mobile

**`Connection refused` / `Failed host lookup` on the Android emulator**
Use `API_BASE_URL=http://10.0.2.2:3001`; `localhost` is the emulator itself.

**A physical device cannot reach the API**
Use your computer's LAN IP, keep both on the same network, and allow port
3001 in your firewall.

**`Cleartext HTTP traffic not permitted` in a release build**
Release builds need an HTTPS API (see [Mobile](./mobile#cleartext-http)).

## Production

**`source .env.production` fails**
Do not source it; Compose and Node read it as plain `KEY=value` lines.
See [Configuration](./configuration).

**The API container is `unhealthy`**
`curl localhost:3001/api/v1/health`. 503 means it cannot reach Postgres: check
`POSTGRES_*` and `docker compose -f compose.prod.yaml logs postgres migrate`.

**`migrate` exited with an error and nothing else starts**
The other services wait for it. Read `docker compose -f compose.prod.yaml logs migrate`,
fix the cause, and run `bun run prod:up` again.

**Rate limits hit everyone at once**
The API sees the proxy's address for every request. Set `TRUST_PROXY` to your
proxy's address or network.

## Development

**`next dev` created `AGENTS.md` files in `apps/web` or `apps/admin`**
It should not (`agentRules: false` in `next.config.ts`). Delete them.

**Type errors after pulling** — `bun install`, then `bun run typecheck`.

**API tests print `Error: insert failed` or `ECONNREFUSED`**
Expected: those tests simulate failures. Look at the final pass/fail count.
