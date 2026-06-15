# Authentication

## Access Token Flow

- The API issues a short-lived JWT access token
- The token includes the user id, session id, and a per-token `jti`
- Backend guards authorize requests from the bearer token

## Refresh Rotation

- Refresh tokens are longer-lived JWTs
- The API stores only the refresh token hash in PostgreSQL
- Every successful refresh rotates the refresh token
- Reusing an old refresh token triggers session revocation

## Web Cookie Flow

- Next.js stores access and refresh tokens in `Secure`/`HttpOnly` cookies
- Browser JavaScript never receives the refresh token
- Same-origin Next.js route handlers inject bearer tokens when calling the API
- Cookie-authenticated mutations require the CSRF header

```mermaid
sequenceDiagram
  participant Browser
  participant BFF as Next.js BFF
  participant API as NestJS API
  participant DB as PostgreSQL

  Browser->>BFF: POST /api/bff/projects
  BFF->>API: POST /api/v1/projects with access token
  API-->>BFF: 401 expired
  BFF->>API: POST /api/v1/auth/refresh with refresh token
  API->>DB: verify session hash and rotate token
  API-->>BFF: new token pair
  BFF->>API: retry POST /api/v1/projects
  API-->>BFF: 201 created
  BFF-->>Browser: updated cookies + success payload
```

## Flutter Secure Storage Flow

- Access and refresh tokens are stored in platform secure storage
- Dio attaches the access token to each request
- On an eligible `401`, the app performs one refresh attempt
- Concurrent requests share the same refresh promise
- Failure clears tokens and returns the app to login

```mermaid
sequenceDiagram
  participant App as Flutter App
  participant API as NestJS API
  participant DB as PostgreSQL

  App->>API: GET /projects with access token
  API-->>App: 401 expired
  App->>API: POST /auth/refresh with refresh token
  API->>DB: verify session hash
  API-->>App: new access token + refresh token
  App->>API: retry GET /projects once
  API-->>App: 200 projects
```

## Session Revocation

- `logout` revokes the current session
- `logout-all` revokes all active sessions for the user
- Admin user blocking also revokes active sessions

## Email Verification

- Verification tokens are single-use and time-limited
- Only hashed verification tokens are stored
- Local development sends mail through Mailpit

## Password Reset

- Forgot-password responses do not reveal whether the email exists
- Reset tokens are single-use and time-limited
- Only hashed reset tokens are stored

## Security Assumptions

- JWT secrets are environment-specific
- HTTPS is required for secure cookies in production
- Tokens, passwords, cookies, and reset data are redacted from logs
- Authorization remains server-enforced even when the UI hides actions
