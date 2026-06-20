# Troubleshooting

## Server start

- The local Browser Control MCP bridge for this repo is `pnpm --filter @repo/extension dev`.
- Default endpoint is `http://localhost:9224/mcp`.
- In this repo's local-trust mode, localhost sessions do not require `PLAYWRIGHT_MCP_EXTENSION_TOKEN`.
- The supported control path is: loaded browser extension -> local MCP bridge -> agent.
- A separate automation browser is the wrong execution model for this workflow.

## Known failure shapes

### `EADDRINUSE` on port `9224`

Cause: another Browser Control bridge process is already listening.

Check:

```bash
lsof -nP -iTCP:9224 -sTCP:LISTEN
```

If the existing process is unhealthy, restart it.

### MCP session disappears between calls

Cause: one-off `curl` calls are too brittle for multi-step work.

Fix: run the whole interaction inside one Node process with `scripts/run-plan.mjs`.

### Too many tabs remain open after a run

Cause: the run opened tabs without ownership-aware cleanup.

Fix:

1. use `scripts/run-plan.mjs`
2. keep `cleanup` as the default `"created-tabs"`
3. only switch to `"none"` when the task explicitly needs the tabs left open

### `connect.html` appears in `browser_tabs`

This is normal for the extension flow during bootstrap.

In this repo's local-trust mode it should auto-close after attaching to a real tab. If it keeps appearing or piling up, the extension reload may be stale or the session may be dying before attach completes.

### `Target page, context or browser has been closed`

Most often caused by:

- trying to manually rewrite the extension `connect.html` URL after the session started
- session drift after a failed connect attempt

Fix:

1. restart the MCP server
2. create a fresh MCP session
3. rerun the plan in one process

The bundled helper now retries once by creating a fresh MCP session automatically when it sees this failure shape mid-plan. If the second attempt also fails, treat the server or extension state as unhealthy and restart it explicitly.

### A separate browser opens during testing

Cause: the workflow fell back to a standalone automation browser instead of using the loaded extension bridge.

Fix:

1. stop that run immediately
2. use only `pnpm --filter @repo/extension dev` plus `pnpm run browser-control:plan -- <plan.json>`
3. verify the target browser already has the Browser Control extension loaded
4. do not use any Playwright sandbox/browser-launch tooling for this task

### Login page shows `401 Unauthorized` for `/api/auth/session`

This can be a real console error even when the UI later redirects to login correctly. Treat it as a noisy UX/runtime issue worth reporting, not automatically a backend outage.

### Password field autocomplete warning

Chrome may log a verbose DOM warning suggesting `autocomplete="current-password"`. Treat this as a real UI quality issue if it appears on login forms.

### Snapshot says the UI is fine, but the design still looks wrong

Cause: accessibility snapshots are structural, not visual. They miss issues like:

- misaligned diagrams
- labels hidden behind later-rendered shapes
- clipped labels
- weak contrast in rendered graphics
- awkward spacing
- wrong visual hierarchy

Fix:

1. capture a screenshot file with `browser_take_screenshot`
2. inspect the screenshot image directly
3. run an occlusion pass on labels, edges, and layered graphics
4. if overlap is suspected, inspect SVG/component coordinates or render order
5. use the snapshot only as supporting structure, not as the primary visual evidence

### A diagram label is partially covered by a card or box

Most often caused by:

- label text rendered earlier in the SVG tree than the shape that covers it
- label `x`/`y` coordinates placed inside the next layer's visual area
- section spacing that looked fine structurally but fails visually at real scale

Fix:

1. verify the overlap in a screenshot, not only the accessibility snapshot
2. inspect the component source for render order and coordinates
3. move the label farther from the next layer or render it later in the SVG tree
