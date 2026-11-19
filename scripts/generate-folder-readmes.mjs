#!/usr/bin/env node
/**
 * Generates the per-layer README files from one template each, so every folder
 * states the same contract and none of them drift.
 *
 *   node scripts/generate-folder-readmes.mjs           # write
 *   node scripts/generate-folder-readmes.mjs --check   # fail if stale
 *
 * A README is only written where the folder already exists, and never
 * overwrites a package-level README (those are hand-written per feature).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const LAYERS = {
  application: `# application/

Orchestration: the place that decides *when* things happen.

**Put here**
- \`*.use-case.ts\` — one operation, only when it owns a transaction, coordinates
  ≥2 collaborators, or carries a rule that deserves its own test.
- \`*.service.ts\` — behaviour shared by several use-cases.
- \`ports/\` — only with two implementations, a process boundary, or a
  cross-feature seam. A repository with one implementation is injected as a class.

**Do not put here**
- SQL/Drizzle, HTTP decorators, DTOs from \`presentation/\`.
- Another feature's internals (use \`@repo/feature-x/contracts\`).
- A three-line class that forwards one repository call.

Rules: \`docs/layers/application.md\` · global contract: \`AGENTS.md\`.
`,
  domain: `# domain/

Pure rules and invariants — testable without a database, a clock or a framework.

**Put here**
- Policies and value rules with edge cases (\`canAccessFile\`, \`refresh-rotation\`).
- Pure helpers that deserve their own test names.

**Do not put here**
- Nest decorators, Drizzle, \`process.env\`, \`fetch\`, DTOs, mappers, repositories.
- Anything whose only test would be a mock assertion.

Enforced by \`scripts/check-domain-purity.mjs\`. Rules: \`docs/layers/domain.md\`.
`,
  infrastructure: `# infrastructure/

Everything that talks to the outside world.

**Put here**
- \`persistence/\` — Drizzle tables and row types for this feature.
- \`*.repository.ts\` — every query this context owns. Accept the opaque
  \`TransactionExecutor\` and narrow it inside the class.
- Adapters to external services (storage, mail, Redis, OIDC).

**Do not put here**
- Business decisions, HTTP concerns, DTOs.
- A repository interface with one implementation — inject the class.

Rules: \`docs/layers/infrastructure.md\`. Schema changes need a new migration.
`,
  presentation: `# presentation/

The HTTP edge: routing, validation, auth, response shaping.

**Put here**
- \`*.controller.ts\` — route + \`@Authorize\` + DTO in, use-case out.
- \`dto/\` — class-validator request/response shapes.

**Do not put here**
- Repository/Drizzle access, another feature's internals.
- Error JSON built by hand — throw \`AppError\`.
- \`@Public()\` without a comment saying why the route is unauthenticated.

Rules: \`docs/layers/presentation.md\`. HTTP behaviour needs an e2e spec.
`,
};

const APPS = {
  "apps/admin": `# admin

Next.js operations console and auth BFF (port 3002). Same-origin session, CSRF
on every mutation, feature folders under \`src/features/<area>\`.

- Theme: stock shadcn defaults in \`src/app/theme.css\`; components use semantic
  tokens (\`bg-primary\`, \`text-muted-foreground\`) so a rebrand is one file.
- BFF routes under \`src/app/api/*\` read cookies, call the API, and never expose
  raw tokens to the browser.
- A UI component does not fetch data: data lives in \`features/<area>/api|controllers\`.

Commands: \`pnpm --filter admin dev|test|typecheck\`. Rules: \`AGENTS.md\`.
`,
  "apps/web": `# web

Next.js public landing and auth-facing pages (port 3000). Marketing only —
product flows live in \`apps/admin\`.

- Server env is validated in \`src/core/config\`; \`NEXT_PUBLIC_*\` values that are
  unset must not fall back to localhost in a production build.
- Feature folders under \`src/features/<area>\`; shared UI comes from \`@repo/web-ui\`.

Commands: \`pnpm --filter web dev|test|typecheck\`, e2e in \`apps/web/e2e\`.
`,
  "apps/worker": `# worker

Standalone background host (ADR 0003): no HTTP surface, consumes jobs and
outbox work with the same composed feature graph as the API.

- Register work through feature manifests; do not import feature internals.
- Long-running handlers must be idempotent: a timed-out attempt can be retried
  while the first one is still writing.

Commands: \`pnpm --filter worker build|lint|test|typecheck\`.
`,
};

function walkFeaturePackages() {
  const packagesDir = join(ROOT, "packages");
  return readdirSync(packagesDir)
    .filter((name) => name.startsWith("feature-"))
    .map((name) => join("packages", name))
    .filter((dir) => existsSync(join(ROOT, dir, "package.json")));
}

function targets() {
  const files = [];

  for (const pkg of walkFeaturePackages()) {
    for (const [layer, content] of Object.entries(LAYERS)) {
      const dir = join(pkg, "src", layer);
      if (existsSync(join(ROOT, dir))) {
        files.push({ path: join(dir, "README.md"), content });
      }
    }
  }

  for (const [dir, content] of Object.entries(APPS)) {
    if (existsSync(join(ROOT, dir)) && !existsSync(join(ROOT, dir, "README.md"))) {
      files.push({ path: join(dir, "README.md"), content });
    }
  }

  return files;
}

let stale = 0;
let written = 0;

for (const file of targets()) {
  const absolute = join(ROOT, file.path);
  const current = existsSync(absolute) ? readFileSync(absolute, "utf8") : null;

  if (current === file.content) continue;

  if (CHECK) {
    stale += 1;
    console.error(`stale: ${file.path}`);
    continue;
  }

  writeFileSync(absolute, file.content);
  written += 1;
}

if (CHECK) {
  if (stale > 0) {
    console.error(
      `${stale} folder README(s) out of date. Run: node scripts/generate-folder-readmes.mjs`,
    );
    process.exit(1);
  }
  console.log("Folder READMEs are up to date.");
} else {
  console.log(`Folder READMEs written: ${written}.`);
}
