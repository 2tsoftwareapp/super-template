# Configuration

Every variable is validated with Zod in `packages/config` when a process
starts; a missing or malformed value stops the boot with a readable message.
Copy `.env.example` to `.env` for local development. Exported variables win
over `.env`.

| Variable            | Used by        | Default                  | Notes                                                        |
| ------------------- | -------------- | ------------------------ | ------------------------------------------------------------ |
| `DATABASE_URL`      | api, worker    | required                 | Postgres connection string                                   |
| `NODE_ENV`          | api, worker    | `development`            | `development`, `test` or `production`                        |
| `API_PORT`          | api            | `3001`                   |                                                              |
| `TRUST_PROXY`       | api            | `loopback`               | Express `trust proxy`: hops allowed to set `X-Forwarded-For` |
| `JWT_ACCESS_SECRET` | api            | required                 | at least 32 characters; HS256                                |
| `JWT_ACCESS_TTL`    | api, admin     | `15m`                    | also sets the admin access cookie lifetime                   |
| `JWT_REFRESH_TTL`   | api, admin     | `30d`                    | also sets the admin refresh cookie lifetime                  |
| `STORAGE_DIR`       | api            | `./storage`              | local file storage root                                      |
| `MAX_UPLOAD_BYTES`  | api            | `5242880` (5 MB)         | enforced by multer before the file is buffered               |
| `SMTP_URL`          | api, worker    | unset                    | without it, `mail.send` jobs fail                            |
| `MAIL_FROM`         | worker         | `no-reply@example.local` |                                                              |
| `ADMIN_EMAIL`       | `pnpm db:seed` | none                     | first admin account                                          |
| `ADMIN_PASSWORD`    | `pnpm db:seed` | none                     | first admin password                                         |

Secrets never go in the repository. `.env.example` holds placeholders only.
