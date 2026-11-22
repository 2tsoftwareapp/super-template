# Admin and web

Both apps use Next.js 16, React 19, Tailwind CSS v4 and
[shadcn/ui](https://ui.shadcn.com) (`new-york` style, `neutral` base colour,
CSS variables). Primitives live in `components/ui/`, the theme in
`app/globals.css`, and `cn()` in `lib/utils.ts`.

Add a component with the shadcn CLI from the app folder:

```bash
cd apps/admin
pnpm dlx shadcn@latest add dropdown-menu
```

## Admin (`apps/admin`, port 3002)

Pages: login, dashboard, users, jobs, notifications.

The browser only talks to the admin's own route handlers under `app/api/`
(the BFF). They forward to the API with the access token from an `httpOnly`
cookie:

- Cookie lifetimes follow `JWT_ACCESS_TTL` and `JWT_REFRESH_TTL`.
- On a 401 the BFF refreshes once and retries. A request that loses a
  concurrent refresh (`AUTH_SESSION_ROTATED`) is retried by the page instead of
  signing the user out.
- `/api/auth/refresh` rejects cross-origin requests.
- A non-JSON upstream response becomes a 502 instead of a crash.

Destructive actions (Block, Delete) ask for confirmation in an `AlertDialog`,
and API errors are shown inline with their message.

## Web (`apps/web`, port 3000)

A static landing page built from the same shadcn primitives (`Button`, `Card`,
`Badge`). Point its links at your own product.
