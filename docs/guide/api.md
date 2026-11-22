# API reference

Base URL: `http://localhost:3001/api/v1`. Send `Authorization: Bearer <accessToken>`
on every route not marked public.

## Envelopes

```json
{ "data": { "id": "…" } }
{ "data": [ … ], "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
{ "error": { "code": "USER_NOT_FOUND", "message": "User not found" } }
```

Request bodies and queries are validated per route with `validate(Dto)`;
unknown properties are rejected. Server errors (5xx) always answer
`INTERNAL_ERROR` with a generic message.

## Routes

| Method | Path                      | Access      | Purpose                                          |
| ------ | ------------------------- | ----------- | ------------------------------------------------ |
| POST   | `/auth/login`             | public      | email + password → token pair (rate limited)     |
| POST   | `/auth/refresh`           | public      | rotate the refresh token                         |
| POST   | `/auth/logout`            | public      | revoke the session of a refresh token            |
| GET    | `/auth/me`                | user        | current user                                     |
| GET    | `/users`                  | admin       | list, search, paginate                           |
| GET    | `/users/:id`              | admin       | one user                                         |
| POST   | `/users`                  | admin       | create (also sends a welcome notification)       |
| PATCH  | `/users/:id`              | admin       | update name or role                              |
| PATCH  | `/users/:id/status`       | admin       | `ACTIVE` / `BLOCKED` (blocking revokes sessions) |
| DELETE | `/users/:id`              | admin       | delete                                           |
| POST   | `/files`                  | user        | multipart upload, field `file`                   |
| GET    | `/files/:id`              | owner/admin | metadata                                         |
| GET    | `/files/:id/download`     | owner/admin | bytes                                            |
| GET    | `/notifications`          | user        | own notifications                                |
| PATCH  | `/notifications/:id/read` | user        | mark one read                                    |
| POST   | `/notifications`          | admin       | send to a user                                   |
| GET    | `/jobs`                   | admin       | list, filter by status                           |
| GET    | `/jobs/:id`               | admin       | one job                                          |
| POST   | `/jobs`                   | admin       | enqueue `demo.echo`, `demo.fail` or `mail.send`  |
| POST   | `/mail/send`              | admin       | enqueue a `mail.send` job                        |

Admins cannot block, delete or demote themselves (`USER_SELF_ACTION_FORBIDDEN`).
Files belonging to someone else answer `404 FILE_NOT_FOUND`, never 403, so their
existence is not revealed. Allowed upload types: PNG, JPEG, WebP, PDF, plain text, CSV.

## Error codes

Defined in `apps/api/src/shared/errors.ts`.

| Code                         | Status | When                                                       |
| ---------------------------- | ------ | ---------------------------------------------------------- |
| `VALIDATION_FAILED`          | 400    | body, query or path parameter is invalid                   |
| `REQUEST_REJECTED`           | 4xx    | other framework 4xx without a specific code                |
| `AUTH_INVALID_CREDENTIALS`   | 401    | wrong email or password                                    |
| `AUTH_UNAUTHORIZED`          | 401    | missing, expired or invalid token; blocked or deleted user |
| `AUTH_TOKEN_REUSED`          | 401    | an old refresh token came back; every session revoked      |
| `AUTH_SESSION_ROTATED`       | 401    | lost a concurrent refresh; retry with the new token        |
| `AUTH_FORBIDDEN`             | 403    | role not allowed                                           |
| `USER_SELF_ACTION_FORBIDDEN` | 403    | admin acting on their own account                          |
| `USER_NOT_FOUND`             | 404    |                                                            |
| `FILE_NOT_FOUND`             | 404    | missing, or not yours                                      |
| `JOB_NOT_FOUND`              | 404    |                                                            |
| `NOTIFICATION_NOT_FOUND`     | 404    |                                                            |
| `ROUTE_NOT_FOUND`            | 404    | unknown path                                               |
| `USER_EMAIL_TAKEN`           | 409    | duplicate email, including concurrent creates              |
| `FILE_TOO_LARGE`             | 413    | over `MAX_UPLOAD_BYTES`                                    |
| `FILE_TYPE_NOT_ALLOWED`      | 415    | MIME type not in the allow-list                            |
| `RATE_LIMITED`               | 429    | too many login attempts                                    |
| `INTERNAL_ERROR`             | 500    | anything unexpected                                        |
