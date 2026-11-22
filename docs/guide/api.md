# API reference

Base URL: `http://localhost:3001/api/v1`. Send `Authorization: Bearer <accessToken>`
on every route not marked public. Every response carries an `x-request-id`
header; send your own (letters, digits, `-`, `_`) to trace a call through the logs.

## Envelopes

```json
{ "data": { "id": "…" } }
{ "data": [ … ], "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
{ "error": { "code": "USER_NOT_FOUND", "message": "User not found" } }
```

Bodies and queries are validated per route with `validate(Dto)`; unknown
properties are rejected with `400 VALIDATION_FAILED`. Server errors (5xx)
always answer `INTERNAL_ERROR` with a generic message; the details are logged.
List routes take `page` (from 1) and `limit` (1–100, default 20).

## Routes

### Health

| Method | Path      | Access | Purpose                                                                     |
| ------ | --------- | ------ | --------------------------------------------------------------------------- |
| GET    | `/health` | public | `{ "status": "ok", "database": "ok" }`, or 503 when Postgres is unreachable |

### Auth and account

| Method | Path                    | Access | Purpose                                                                    |
| ------ | ----------------------- | ------ | -------------------------------------------------------------------------- |
| POST   | `/auth/register`        | public | `{ email, password, displayName }` → session (201)                         |
| POST   | `/auth/login`           | public | `{ email, password }` → session                                            |
| POST   | `/auth/refresh`         | public | `{ refreshToken }` → new session (rotation)                                |
| POST   | `/auth/logout`          | public | `{ refreshToken }` → 204, revokes that session                             |
| POST   | `/auth/forgot-password` | public | `{ email }` → 202, always; mails a link when the account exists            |
| POST   | `/auth/reset-password`  | public | `{ token, password }` → 204, signs out every device                        |
| POST   | `/auth/change-password` | user   | `{ currentPassword, newPassword }` → new session; other devices signed out |
| GET    | `/auth/me`              | user   | current user                                                               |
| PATCH  | `/auth/me`              | user   | `{ displayName }`                                                          |

A session is `{ accessToken, refreshToken, user }`. Passwords are 8 to 128
characters. Login, register and forgot/reset password are rate limited; see
[Authentication](./auth).

### Users (admin)

| Method | Path                | Purpose                                                      |
| ------ | ------------------- | ------------------------------------------------------------ |
| GET    | `/users`            | list; `search` matches email and display name                |
| GET    | `/users/:id`        | one user                                                     |
| POST   | `/users`            | create (also sends a welcome notification)                   |
| PATCH  | `/users/:id`        | update display name or role                                  |
| PATCH  | `/users/:id/status` | `ACTIVE` / `BLOCKED`; blocking signs the user out everywhere |
| DELETE | `/users/:id`        | delete                                                       |

Admins cannot block, delete or demote themselves (`USER_SELF_ACTION_FORBIDDEN`).

### Files

| Method | Path                  | Access      | Purpose                               |
| ------ | --------------------- | ----------- | ------------------------------------- |
| POST   | `/files`              | user        | multipart upload, field `file`        |
| GET    | `/files`              | user        | own files; admins see every file      |
| GET    | `/files/:id`          | owner/admin | metadata                              |
| GET    | `/files/:id/download` | owner/admin | the bytes, with `Content-Disposition` |
| DELETE | `/files/:id`          | owner/admin | delete row and bytes                  |

Allowed types: PNG, JPEG, WebP, PDF, plain text, CSV. Someone else's file
answers `404 FILE_NOT_FOUND`, never 403, so its existence is not revealed.

### Notifications, jobs, mail

| Method | Path                      | Access | Purpose                                                    |
| ------ | ------------------------- | ------ | ---------------------------------------------------------- |
| GET    | `/notifications`          | user   | own notifications; `meta.unread` counts unread             |
| PATCH  | `/notifications/:id/read` | user   | mark one read                                              |
| POST   | `/notifications`          | admin  | `{ userId, type, title, body }`                            |
| GET    | `/jobs`                   | admin  | list; filter with `status`                                 |
| GET    | `/jobs/:id`               | admin  | one job, with attempts and last error                      |
| POST   | `/jobs`                   | admin  | `{ type, payload }`: `demo.echo`, `demo.fail`, `mail.send` |
| POST   | `/mail/send`              | admin  | `{ to, subject, text }` → 202, queues `mail.send`          |

## Try it with curl

```bash
API=http://localhost:3001/api/v1

# Sign up (or sign in with /auth/login) and keep the access token
TOKEN=$(curl -s -X POST $API/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"jane@example.com","password":"Sup3rSecret!","displayName":"Jane"}' \
  | jq -r .data.accessToken)

curl -s $API/auth/me -H "authorization: Bearer $TOKEN"

# Upload and list files
curl -s -X POST $API/files -H "authorization: Bearer $TOKEN" -F file=@report.pdf
curl -s "$API/files?page=1&limit=10" -H "authorization: Bearer $TOKEN"

# Forgot password: the link arrives in Mailpit (http://localhost:8025)
curl -s -X POST $API/auth/forgot-password \
  -H 'content-type: application/json' -d '{"email":"jane@example.com"}'
```

Admin-only calls need an admin token, for example from
`POST /auth/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`:

```bash
curl -s -X POST $API/jobs -H "authorization: Bearer $ADMIN_TOKEN" \
  -H 'content-type: application/json' -d '{"type":"demo.echo","payload":{"hello":"world"}}'
curl -s "$API/users?search=jane" -H "authorization: Bearer $ADMIN_TOKEN"
```

## Error codes

Defined in `apps/api/src/shared/errors.ts`.

| Code                         | Status | When                                                                |
| ---------------------------- | ------ | ------------------------------------------------------------------- |
| `VALIDATION_FAILED`          | 400    | body, query or path parameter is invalid                            |
| `AUTH_RESET_TOKEN_INVALID`   | 400    | reset link unknown, used or older than one hour                     |
| `REQUEST_REJECTED`           | 4xx    | other framework 4xx without a specific code                         |
| `AUTH_INVALID_CREDENTIALS`   | 401    | wrong email or password (also wrong current password)               |
| `AUTH_UNAUTHORIZED`          | 401    | missing, expired, invalid or revoked token; blocked or deleted user |
| `AUTH_TOKEN_REUSED`          | 401    | an old refresh token came back; every session revoked               |
| `AUTH_SESSION_ROTATED`       | 401    | lost a concurrent refresh; retry with the new token                 |
| `AUTH_FORBIDDEN`             | 403    | role not allowed; BFF: bad origin                                   |
| `AUTH_REGISTRATION_DISABLED` | 403    | `ALLOW_REGISTRATION=false`                                          |
| `USER_SELF_ACTION_FORBIDDEN` | 403    | admin acting on their own account                                   |
| `USER_NOT_FOUND`             | 404    |                                                                     |
| `FILE_NOT_FOUND`             | 404    | missing, or not yours                                               |
| `JOB_NOT_FOUND`              | 404    |                                                                     |
| `NOTIFICATION_NOT_FOUND`     | 404    |                                                                     |
| `ROUTE_NOT_FOUND`            | 404    | unknown path                                                        |
| `USER_EMAIL_TAKEN`           | 409    | duplicate email, including concurrent sign-ups                      |
| `FILE_TOO_LARGE`             | 413    | over `MAX_UPLOAD_BYTES`                                             |
| `FILE_TYPE_NOT_ALLOWED`      | 415    | MIME type not in the allow-list                                     |
| `RATE_LIMITED`               | 429    | too many attempts                                                   |
| `INTERNAL_ERROR`             | 500    | anything unexpected                                                 |
| `SERVICE_UNAVAILABLE`        | 503    | `/health` cannot reach Postgres                                     |
