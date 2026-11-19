# admin

Next.js operations console and auth BFF (port 3002). Same-origin session, CSRF
on every mutation, feature folders under `src/features/<area>`.

- Theme: stock shadcn defaults in `src/app/theme.css`; components use semantic
  tokens (`bg-primary`, `text-muted-foreground`) so a rebrand is one file.
- BFF routes under `src/app/api/*` read cookies, call the API, and never expose
  raw tokens to the browser.
- A UI component does not fetch data: data lives in `features/<area>/api|controllers`.

Commands: `pnpm --filter admin dev|test|typecheck`. Rules: `AGENTS.md`.
