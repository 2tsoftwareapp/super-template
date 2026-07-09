# Web E2E (Playwright)

The web app is an SEO landing only. Auth and operations live in **admin** (`:3002`).

## Run

```bash
# With Docker (Postgres) + dev servers started by Playwright
pnpm --filter web test:e2e

# Against an already-running web dev server
PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm --filter web test:e2e
```

## Coverage

- `landing.spec.ts` — marketing page renders, admin CTA visible, `/login` returns 404 on web

For auth/admin flows, use `apps/admin` E2E or API e2e tests.
