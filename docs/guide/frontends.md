# Web and admin

Both apps use Next.js 16, React 19, Tailwind CSS v4 and
[shadcn/ui](https://ui.shadcn.com) (`new-york` style, `neutral` base colour,
CSS variables). Primitives live in `components/ui/`, the theme in
`app/globals.css`, and `cn()` in `lib/utils.ts`.

Add a component with the shadcn CLI from the app folder:

```bash
cd apps/web
bunx shadcn@latest add dropdown-menu
```

## Web (`apps/web`, port 3000)

| Page               | What it does                                               |
| ------------------ | ---------------------------------------------------------- |
| `/`                | landing page                                               |
| `/register`        | sign up, then straight to `/account`                       |
| `/login`           | sign in; links to forgot password and sign up              |
| `/forgot-password` | asks for an email; the reset link arrives by mail          |
| `/reset-password`  | reads `?token=` from the mail link and sets a new password |
| `/account`         | profile name, password change, sign out (signed-in only)   |

`proxy.ts` sends signed-out visitors of `/account` to `/login`. It only checks
that a session cookie exists; the API still authorizes every call.

|                  Register                  |                     Forgot password                      |
| :----------------------------------------: | :------------------------------------------------------: |
| ![Register](/screenshots/web-register.png) | ![Forgot password](/screenshots/web-forgot-password.png) |

## Admin (`apps/admin`, port 3002)

| Page             | What it does                                                        |
| ---------------- | ------------------------------------------------------------------- |
| `/login`         | sign-in; every console call needs the `ADMIN` role (others get 403) |
| `/`              | dashboard: links to every section                                   |
| `/users`         | search, create, change role, block, delete (with confirmation)      |
| `/files`         | every upload: download or delete                                    |
| `/jobs`          | queue by status, enqueue demo jobs, read the last error             |
| `/notifications` | your own inbox: unread count, mark read                             |
| `/account`       | change your own password                                            |

![Admin dashboard](/screenshots/admin-dashboard.png)

## The BFF (`packages/next-bff`)

The browser only talks to each app's own route handlers under `app/api/`.
They forward to the API with the access token from an `httpOnly` cookie. The
shared package holds everything both apps need:

| Export                                                 | Use it in             | Does                                                              |
| ------------------------------------------------------ | --------------------- | ----------------------------------------------------------------- |
| `proxyWithSession(req, path, init)`                    | route handlers        | forwards with the access token; on 401 refreshes once and retries |
| `downloadWithSession(req, path)`                       | route handlers        | streams binary responses (file downloads)                         |
| `startSession(req, path)`                              | login/register routes | calls the API and sets both cookies                               |
| `forwardPublic(req, path)`                             | forgot/reset routes   | forwards a public call without cookies                            |
| `endSession(req)`                                      | logout route          | revokes the refresh token and clears cookies                      |
| `isSameOrigin`, `badOrigin`                            | every write           | CSRF guard on cookie-authenticated mutations                      |
| `sessionFetch`, `sendJson`, `errorMessage` (`/client`) | client components     | fetch a BFF route; retry once after a lost concurrent refresh     |

Behaviour worth knowing:

- Cookie lifetimes follow `JWT_ACCESS_TTL` and `JWT_REFRESH_TTL`.
- Concurrent refreshes in one server process share one request; a request that
  still loses the race (`AUTH_SESSION_ROTATED`) is retried by `sessionFetch`.
- A non-JSON upstream response becomes a 502 instead of a crash.

### Expose an API route to the browser

```ts
// apps/web/app/api/notes/route.ts
import type { NextRequest, NextResponse } from "next/server";
import { badOrigin, proxyWithSession } from "@lean/next-bff";
import { isSameOrigin } from "@/lib/is-same-origin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyWithSession(request, "/notes");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return badOrigin();
  return proxyWithSession(request, "/notes", { method: "POST", body: await request.text() });
}
```

Every `POST`, `PATCH` and `DELETE` handler checks the origin first.
The full walk-through is in [Add a feature](./add-a-feature).
