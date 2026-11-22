# Configuration

Every process validates its environment with Zod (`packages/config`) when it
starts. A missing or malformed value stops the boot with one readable line,
for example `Invalid environment: JWT_ACCESS_SECRET: must be at least 32 characters`.

| File                      | Used for                                   | In git |
| ------------------------- | ------------------------------------------ | ------ |
| `.env.example`            | local development placeholders             | yes    |
| `.env`                    | your local values (`cp .env.example .env`) | no     |
| `.env.production.example` | the production stack (`compose.prod.yaml`) | yes    |
| `.env.production`         | your production values                     | no     |

The API, worker and database scripts load `.env` themselves
(`--env-file-if-exists`). Exported shell variables win over the file.

::: warning Do not `source` the env files
Docker Compose and Node read them as plain `KEY=value` lines. Values such as
`MAIL_FROM=Lean <no-reply@example.com>` or a comma list with spaces are not
valid shell, so `source .env.production` fails. Read one value with
`grep '^ADMIN_EMAIL=' .env.production | cut -d= -f2-` instead.
:::

## API (`apps/api`)

| Variable             | Default                 | Notes                                                                  |
| -------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`       | required                | Postgres connection string                                             |
| `NODE_ENV`           | `development`           | `production` switches logs to JSON                                     |
| `API_PORT`           | `3001`                  |                                                                        |
| `JWT_ACCESS_SECRET`  | required                | at least 32 characters, HS256. Generate with `openssl rand -base64 48` |
| `JWT_ACCESS_TTL`     | `15m`                   | `<number><s\|m\|h\|d>`                                                 |
| `JWT_REFRESH_TTL`    | `30d`                   | same format                                                            |
| `TRUST_PROXY`        | `loopback`              | Express `trust proxy`: hops allowed to set `X-Forwarded-For`           |
| `CORS_ORIGINS`       | empty (CORS off)        | comma-separated origins that call the API from a browser directly      |
| `WEB_URL`            | `http://localhost:3000` | the reset mail links to `${WEB_URL}/reset-password`                    |
| `ALLOW_REGISTRATION` | `true`                  | `false` disables `POST /auth/register`; admins can still create users  |
| `STORAGE_DIR`        | `./storage`             | upload root, relative to the API's working directory                   |
| `MAX_UPLOAD_BYTES`   | `5242880` (5 MB)        | enforced before the file is buffered                                   |

The API never talks to SMTP: it queues `mail.send` jobs, and the worker
sends them with the settings below.

The web and admin BFFs call the API from the server, so they do not need CORS.
Set `CORS_ORIGINS` only for a browser app that calls the API itself.

## Worker (`apps/worker`)

| Variable       | Default                  | Notes                                                       |
| -------------- | ------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL` | required                 |                                                             |
| `NODE_ENV`     | `development`            | `production` switches logs to JSON                          |
| `SMTP_URL`     | unset                    | without it `mail.send` jobs fail; other job types still run |
| `MAIL_FROM`    | `no-reply@example.local` | sender of every mail                                        |

## Database scripts (`packages/db`)

| Variable         | Used by       | Default                                                  |
| ---------------- | ------------- | -------------------------------------------------------- |
| `DATABASE_URL`   | migrate, seed | required                                                 |
| `MIGRATIONS_DIR` | migrate       | `packages/db/migrations`                                 |
| `ADMIN_EMAIL`    | seed          | `admin@example.local`                                    |
| `ADMIN_PASSWORD` | seed          | `ChangeMe123!` — always set it outside local development |

## Web and admin (`apps/web`, `apps/admin`)

Read on the server only; nothing here reaches the browser.

| Variable           | App   | Default                 | Notes                                                  |
| ------------------ | ----- | ----------------------- | ------------------------------------------------------ |
| `API_INTERNAL_URL` | both  | `http://localhost:3001` | where the BFF reaches the API (without `/api/v1`)      |
| `JWT_ACCESS_TTL`   | both  | `15m`                   | lifetime of the `access_token` cookie                  |
| `JWT_REFRESH_TTL`  | both  | `30d`                   | lifetime of the `refresh_token` cookie                 |
| `WEB_ORIGIN`       | web   | `http://localhost:3000` | exact `Origin` accepted on cookie-authenticated writes |
| `ADMIN_ORIGIN`     | admin | `http://localhost:3002` | same, for the admin                                    |
| `ADMIN_URL`        | web   | `http://localhost:3002` | link to the admin on the landing page                  |
| `NODE_ENV`         | both  | set by Next             | `production` marks cookies `Secure` (HTTPS only)       |

The origin must match what the browser shows exactly: `http://127.0.0.1:3000`
is not `http://localhost:3000`. A mismatch answers `403 Bad origin`.

## Mobile (`apps/mobile`)

Compile-time only, through `--dart-define`:

| Define         | Default                | Notes                                          |
| -------------- | ---------------------- | ---------------------------------------------- |
| `API_BASE_URL` | `http://10.0.2.2:3001` | API origin without `/api/v1`; HTTPS in release |

## Production stack (`compose.prod.yaml`)

`.env.production` holds everything above plus the Postgres container settings:

| Variable            | Notes                                         |
| ------------------- | --------------------------------------------- |
| `POSTGRES_USER`     | database user created on first start          |
| `POSTGRES_PASSWORD` | required; compose refuses to start without it |
| `POSTGRES_DB`       | database name                                 |

Compose builds `DATABASE_URL` from these and sets `API_INTERNAL_URL=http://api:3001`
for web and admin. See [Deployment](./deployment).

Secrets never go in the repository. `.env.example` holds placeholders only.
