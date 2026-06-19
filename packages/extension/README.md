# @repo/extension

A browser extension that lets AI agents control your real Chrome/Edge browser
— navigate, click, fill forms, take snapshots — through the [Playwright MCP]
server (`@playwright/mcp --extension`). This is the same CDP-relay mechanism
behind "Claude in Chrome": the extension attaches Chrome's debugger API to a
tab you pick and relays commands over a local WebSocket; Playwright drives
that tab like any other CDP target.

The extension source (`src/`, `manifest.json`, `icons/`) is vendored from the
upstream open-source [`microsoft/playwright` › `packages/extension`][upstream]
(Apache-2.0) so it builds and lints inside this monorepo's pnpm/turbo/eslint
setup. Re-vendor by diffing against that path if Playwright ships protocol
changes.

[Playwright MCP]: https://github.com/microsoft/playwright-mcp
[upstream]: https://github.com/microsoft/playwright/tree/main/packages/extension

## What this gives you

- **The extension** — an unpacked Chrome/Edge extension you load once that
  exposes your already-logged-in browser tabs to MCP clients.
- **A shared MCP server** — `pnpm --filter @repo/extension dev` starts
  `playwright-mcp --extension` on a fixed HTTP port (`EXTENSION_MCP_PORT`,
  default `9224`) with `--shared-browser-context`, so multiple MCP clients
  (Claude Code, another agent, a script) can connect to the *same* browser
  session at once instead of each spawning their own browser.
- **MCP registration** — the root [`.mcp.json`](../../.mcp.json) already
  registers this server as `browser-extension`, so any MCP-aware agent
  working in this repo can pick it up automatically.

## Setup

1. Build the unpacked extension:

   ```bash
   pnpm --filter @repo/extension build
   ```

   This writes an unpacked extension to `packages/extension/dist/`.

2. Load it in Chrome/Edge: open `chrome://extensions`, enable **Developer
   mode**, click **Load unpacked**, and select `packages/extension/dist/`.

   (Alternatively, install the published ["Playwright Extension"][store] from
   the Chrome Web Store — it's the same code, signed by Microsoft.)

3. Start the shared MCP server:

   ```bash
   pnpm --filter @repo/extension dev
   # or: make extension-dev
   ```

   This binds `http://localhost:9224/mcp` (override the port with
   `EXTENSION_MCP_PORT` in `.env`).

4. Point an MCP client at it. Claude Code already does this via `.mcp.json`
   (`browser-extension` server). For other tools, configure an HTTP MCP
   client pointed at `http://localhost:${EXTENSION_MCP_PORT}/mcp`.

5. The first time an agent connects, the extension opens a tab picker so you
   choose which browser tab it can control. Use the extension's status page
   to copy a `PLAYWRIGHT_MCP_EXTENSION_TOKEN` if you want to skip that
   approval dialog on every connection (see the extension's own popup/status
   UI for the token).

[store]: https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm

## Using it alongside Playwright tests

This connects to your *real* browser profile (cookies, sessions, extensions
already installed), which is complementary to — not a replacement for — the
isolated `apps/web/e2e` Playwright suite:

- Use `apps/web/e2e` (`pnpm --filter web test:e2e`) for repeatable, CI-run
  assertions against a clean browser/profile.
- Use this extension when an agent needs to drive or inspect the app
  interactively in your logged-in browser (debugging a flaky e2e step,
  exploring a UI bug, recording a new flow before turning it into a
  Playwright test).

Both ultimately talk to the same Playwright engine; the extension just swaps
the browser target from a freshly launched instance to your existing tab.

## Scripts

| Script | Description |
| --- | --- |
| `build` | Bundle the extension into `dist/` via Vite (production-loadable, unpacked). |
| `watch` | Rebuild on change while developing the extension itself. |
| `dev` / `start` | Start the shared Playwright MCP server in `--extension` mode. |
| `typecheck` | Type-check the service worker and UI sources together via `tsconfig.json`. |
| `lint` | ESLint over `src/`. |
