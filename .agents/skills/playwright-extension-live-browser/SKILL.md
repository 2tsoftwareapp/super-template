---
name: playwright-extension-live-browser
description: Use when the user wants browser automation inside their already-running Chrome or Edge through the Browser Control extension bridge, especially for localhost UI checks, logged-in flows, or “use my current browser” requests. Covers starting or reusing the local MCP bridge on port 9224 and driving the loaded browser extension through a single persistent HTTP MCP session instead of one-off curl calls.
---

# Browser Control Live Browser

Use this skill only for `browser-required` tasks that must run in the user's current browser session, not in a fresh automation browser.

## When to use

Trigger this skill when the user says things like:

- "use my current Chrome"
- "I already loaded the extension"
- "check localhost UI in my running browser"
- "use the browser extension / MCP extension"

Do not use this skill for static fetches or for any fallback that launches a separate automation browser.

## Preconditions

Confirm all of these before meaningful browser work:

1. The Browser Control extension is loaded in the user's Chrome or Edge.
2. The local Browser Control MCP bridge is running on `http://localhost:9224/mcp`.
3. In this repo's local-trust setup, loopback localhost sessions are auto-approved and do not need a token.

Recommended server start:

```bash
pnpm --filter @repo/extension dev
```

If port `9224` is already in use, inspect the listener first and decide whether to reuse it or restart it.

## Hard rules

- Keep all MCP tool calls for one browser run inside a single Node process. Do not use disconnected one-off `curl` calls for multi-step work.
- Prefer the bundled helper script in `scripts/run-plan.mjs`.
- The helper reuses a cached `mcp-session-id` when possible, so repeated runs do not keep creating fresh extension handshake tabs.
- The helper now attempts one automatic session reinitialize when a long plan hits a recoverable MCP dropout such as empty SSE output or a closed target page.
- Treat `http://localhost:9224/mcp` as the Browser Control MCP transport, not as a normal HTTP page.
- Do not open or rely on a separate Playwright-managed browser for this workflow. The only valid target is the user's already-running browser with the extension loaded.
- A transient `connect.html?...` URL is expected during session bootstrap, but in local-trust mode it should auto-close after the extension attaches to a real tab.
- For localhost UI work, read console messages and at least one snapshot after navigation.
- For UI review, visual QA, layout checking, diagrams, charts, spacing, overlap, clipping, or “looks wrong” reports, do not stop at `browser_snapshot`. You must also capture screenshots to files and inspect the images directly.
- For web UI and component QA, do not stop at “page looks roughly fine”. Run a component-fidelity pass for radius, border, spacing, color, typography, shadow, and interactive state styling. A small CSS/token mismatch is a real bug even if the page is still usable.
- For SVG, diagram, chart, canvas, or any section with layered graphics, run an explicit occlusion pass: inspect labels near box edges, connector endpoints, and section boundaries for overlap or hidden text. If a screenshot suggests partial overlap, inspect the source geometry or render order before concluding the UI is correct.
- Default cleanup is required: close only tabs created by the run, and leave pre-existing user tabs untouched. The helper now syncs tab inventory after every step so tabs opened indirectly by clicks, redirects, or extension flows are also cleaned up. When a fresh session had to open `connect.html`, the helper closes that handshake tab automatically once a real app tab exists.

## Workflow

1. Start or reuse the product app you need to inspect.
2. Start or reuse the Browser Control MCP bridge.
3. Create a plan JSON file for the browser steps.
4. Run the helper:

```bash
node .agents/skills/playwright-extension-live-browser/scripts/run-plan.mjs /path/to/plan.json
```

Or use the root wrapper:

```bash
pnpm run extension:plan -- /path/to/plan.json
```

Preferred alias:

```bash
pnpm run browser-control:plan -- /path/to/plan.json
```

5. Inspect:
   - `browser_console_messages`
   - `browser_snapshot`
   - `browser_take_screenshot` saved to a file whenever the task is UI review or visual debugging
   - `browser_network_requests` when UI behavior depends on API calls
6. For visual analysis, open the saved screenshot with the local image-view tool and judge the rendered output from the image, not only from the accessibility tree.
7. For diagrams, SVGs, and dense sections, do a second pass focused on visual collisions:
   - scan top-to-bottom and left-to-right instead of only glancing at the center
   - inspect section labels, captions, and small secondary text near borders
   - check whether any text baseline intersects a shape fill or stroke
   - check whether later-rendered boxes, cards, or overlays cover earlier text
   - if something looks suspicious, inspect the component source to verify coordinates or render order
8. If the task includes forms or login, prefer MCP-native tools like `browser_fill_form`, `browser_click`, and `browser_wait_for`.
9. Let the helper clean up created tabs automatically unless the plan explicitly disables it.

## Minimal plan example

```json
{
  "cleanup": "created-tabs",
  "steps": [
    { "tool": "browser_tabs", "args": { "action": "list" } },
    { "tool": "browser_navigate", "args": { "url": "http://localhost:3005" } },
    { "tool": "browser_console_messages", "args": { "level": "info", "all": true } },
    { "tool": "browser_snapshot", "args": { "depth": 4 } },
    { "tool": "browser_take_screenshot", "args": { "type": "png", "filename": "landing.png", "fullPage": true } }
  ]
}
```

`cleanup` modes:

- `"created-tabs"`: default, closes only tabs opened by the run
- `"none"`: keeps everything open

If the cached MCP session gets stale, reset it with:

```bash
pnpm run extension:session:reset
```

Preferred alias:

```bash
pnpm run browser-control:session:reset
```

## UI review rule

For any request equivalent to:

- "check UI"
- "review landing"
- "does the diagram look wrong"
- "find layout issues"
- "check spacing / overlap / clipping"

the minimum evidence set is:

1. `browser_console_messages`
2. `browser_snapshot`
3. one or more `browser_take_screenshot` outputs
4. direct image inspection of those screenshots
5. for diagrams/SVG-heavy sections, an explicit overlap and occlusion check
6. for web/components, an explicit CSS fidelity and design-system pass

## Read next when needed

- For common failure modes around token setup, session lifetime, port conflicts, and accidental browser-launch fallback, read [references/troubleshooting.md](./references/troubleshooting.md).
- For the exact visual audit checklist to apply during UI review, read [references/ui-review-checklist.md](./references/ui-review-checklist.md).
- For detailed web/component checks such as radius, border, spacing, color, and shadcn-style primitive fidelity, read [references/web-fidelity-checklist.md](./references/web-fidelity-checklist.md).
