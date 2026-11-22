# Authentication

## Tokens

- **Access token**: JWT signed and verified with HS256 only, lifetime `JWT_ACCESS_TTL` (15 minutes by default).
- **Refresh token**: opaque random value; only its hash is stored in `sessions`. Lifetime `JWT_REFRESH_TTL` (30 days).

`JwtAuthGuard` loads the user from the database on every authenticated
request. A blocked or deleted user is rejected at once, and the role comes from
the database rather than the token, so a demotion applies immediately.

## Refresh rotation

`POST /auth/refresh` revokes the presented session and creates its successor in
one transaction (`AuthRepository.rotateSession`). Only one of several
concurrent requests can win:

| Situation                                              | Response                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| token is current                                       | 200 with a new pair                                           |
| token was rotated less than 10 s ago (concurrent tabs) | 401 `AUTH_SESSION_ROTATED`; the winner keeps working          |
| token was rotated earlier (replay)                     | 401 `AUTH_TOKEN_REUSED`; every session of the user is revoked |

## Login rate limit

`POST /auth/login` has two buckets:

| Bucket    | Key        | Limit             |
| --------- | ---------- | ----------------- |
| `client`  | IP + email | 10 per minute     |
| `account` | email only | 50 per 15 minutes |

The account bucket does not depend on the IP, so rotating `X-Forwarded-For`
cannot get around it. Set `TRUST_PROXY` to the proxies that may set that header.

## Clients

- **Admin**: the browser never sees tokens. The BFF keeps them in `httpOnly`
  cookies whose lifetimes follow the TTLs, refreshes on 401, and checks the
  origin of `/api/auth/refresh`. See [Admin and web](./frontends).
- **Mobile**: the refresh token lives in `flutter_secure_storage`; see [Mobile](./mobile).
